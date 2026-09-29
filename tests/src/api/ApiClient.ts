import type { APIRequestContext, APIResponse } from '@playwright/test'
import type {
  DataEnvelope,
  HealthResponse,
  LanguageKey,
  RegisterRequest,
  RunRequest,
  RunResponse,
  SubmissionResponse,
  TaskDetail,
  TaskListItem,
  TaskListQuery,
  Topic,
  User,
  ValidationErrorResponse,
} from './types'

/**
 * Futtatas/beadas payload. A nyelv szandekosan barmilyen string lehet,
 * hogy a validacios hibakat (pl. nem tamogatott nyelv) is tesztelni tudjuk.
 */
export type RunPayload = Omit<RunRequest, 'language'> & { language: LanguageKey | (string & {}) }

/**
 * Egy API hivas eredmenye: a statusz es a mar feldolgozott JSON torzs.
 * A `body` tipusa a sikeres valaszt irja le; hibas statusznal az
 * `errorBody` adja a Laravel hibavalasz alakjat.
 */
export class ApiResult<T> {
  constructor(
    readonly response: APIResponse,
    private readonly json: unknown
  ) {}

  get status(): number {
    return this.response.status()
  }

  get ok(): boolean {
    return this.response.ok()
  }

  get body(): T {
    return this.json as T
  }

  get errorBody(): ValidationErrorResponse {
    return this.json as ValidationErrorResponse
  }
}

/**
 * Tipusos kliens a backend `/api/v1` vegpontjaihoz. A Playwright
 * APIRequestContext-re epul, igy a kerelmek megjelennek a trace-ben es
 * a riportban. A baseURL-t es a fejleceket a konfiguracio adja.
 */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  health(): Promise<ApiResult<HealthResponse>> {
    return this.get('health')
  }

  topics(): Promise<ApiResult<DataEnvelope<Topic[]>>> {
    return this.get('topics')
  }

  tasks(query: TaskListQuery = {}): Promise<ApiResult<DataEnvelope<TaskListItem[]>>> {
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined)) as Record<string, string>
    return this.get('tasks', params)
  }

  task(id: number): Promise<ApiResult<DataEnvelope<TaskDetail>>> {
    return this.get(`tasks/${String(id)}`)
  }

  run(payload: RunPayload): Promise<ApiResult<RunResponse>> {
    return this.post('run', payload)
  }

  submit(payload: RunPayload): Promise<ApiResult<SubmissionResponse>> {
    return this.post('submissions', payload)
  }

  register(payload: Partial<RegisterRequest>): Promise<ApiResult<DataEnvelope<User>>> {
    return this.post('auth/register', payload)
  }

  /** Publikalt feladat azonositoja cim alapjan; hibat dob, ha nincs ilyen. */
  async taskIdByTitle(title: string): Promise<number> {
    const { body } = await this.tasks()
    const found = body.data.find((task) => task.title === title)
    if (!found) throw new Error(`Fixture feladat nem talalhato: ${title}`)
    return found.id
  }

  // Megjegyzes: az utvonalak elejen NINCS perjel, kulonben a WHATWG URL
  // feloldas levagna a baseURL /api/v1/ reszet.
  private async get<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
    return this.toResult<T>(await this.request.get(path, { params }))
  }

  private async post<T>(path: string, data: unknown): Promise<ApiResult<T>> {
    return this.toResult<T>(await this.request.post(path, { data }))
  }

  private async toResult<T>(response: APIResponse): Promise<ApiResult<T>> {
    const text = await response.text()
    let json: unknown = null
    if (text) {
      try {
        json = JSON.parse(text)
      } catch {
        throw new Error(`Nem JSON valasz (${String(response.status())}) innen: ${response.url()}\n${text.slice(0, 500)}`)
      }
    }
    return new ApiResult<T>(response, json)
  }
}
