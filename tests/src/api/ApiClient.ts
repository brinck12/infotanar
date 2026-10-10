import type { APIRequestContext, APIResponse } from '@playwright/test'
import type {
  AdminUserRole,
  DataEnvelope,
  HealthResponse,
  LanguageKey,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  RunRequest,
  RunResponse,
  SubmissionResponse,
  TaskDetail,
  TaskListItem,
  TaskListQuery,
  Topic,
  User,
  UserRole,
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
  constructor(
    protected readonly request: APIRequestContext,
    protected readonly token?: string
  ) {}

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

  /** A megerosito level frontend linkjenek query parameterei valtozatlanul mennek az API-nak. */
  verifyEmail(params: URLSearchParams): Promise<ApiResult<MessageResponse>> {
    const { id, hash, ...rest } = Object.fromEntries(params)
    return this.get(`auth/verify-email/${String(id)}/${String(hash)}`, rest)
  }

  /** Publikalt feladat azonositoja cim alapjan; hibat dob, ha nincs ilyen. */
  async taskIdByTitle(title: string): Promise<number> {
    const { body } = await this.tasks()
    const found = body.data.find((task) => task.title === title)
    if (!found) throw new Error(`Fixture feladat nem talalhato: ${title}`)
    return found.id
  }

  login(payload: Partial<LoginRequest>): Promise<ApiResult<DataEnvelope<LoginResponse>>> {
    return this.post('auth/login', payload)
  }

  me(): Promise<ApiResult<DataEnvelope<User>>> {
    return this.get('auth/me')
  }

  logout(): Promise<ApiResult<null>> {
    return this.post('auth/logout', {})
  }

  resendVerification(): Promise<ApiResult<MessageResponse>> {
    return this.post('auth/email/verification-notification', {})
  }

  // Admin felhasznalo-kezeles (#162). A szerepkor szandekosan barmilyen string lehet a validacio tesztelesehez.
  adminChangeRole(userId: number, role: UserRole | (string & {})): Promise<ApiResult<DataEnvelope<AdminUserRole>>> {
    return this.put(`admin/users/${String(userId)}/role`, { role })
  }

  adminResendVerification(userId: number): Promise<ApiResult<MessageResponse>> {
    return this.post(`admin/users/${String(userId)}/verification-notification`, {})
  }

  adminVerifyEmail(userId: number, reason?: string): Promise<ApiResult<null>> {
    return this.post(`admin/users/${String(userId)}/verify-email`, { reason })
  }

  adminRevokeTokens(userId: number): Promise<ApiResult<null>> {
    return this.delete(`admin/users/${String(userId)}/tokens`)
  }

  adminSendPasswordReset(userId: number): Promise<ApiResult<MessageResponse>> {
    return this.post(`admin/users/${String(userId)}/password-reset`, {})
  }

  adminUserPayments(userId: number): Promise<ApiResult<DataEnvelope<unknown[]>>> {
    return this.get(`admin/users/${String(userId)}/payments`)
  }

  /** Csak a hibaagakhoz: sikeres valasznal PDF jon, nem JSON. */
  adminUserInvoice(userId: number, paymentId: string): Promise<ApiResult<MessageResponse>> {
    return this.get(`admin/users/${String(userId)}/payments/${paymentId}/invoice`)
  }

  adminDeleteUser(userId: number): Promise<ApiResult<MessageResponse>> {
    return this.delete(`admin/users/${String(userId)}`)
  }

  /** Ugyanez a kliens Bearer tokennel. */
  withToken(token: string): ApiClient {
    return new ApiClient(this.request, token)
  }

  /** Friss felhasznalo regisztralasa es bejelentkeztetese; a tokenes klienst adja vissza. */
  async signUp(payload: RegisterRequest): Promise<{ client: ApiClient; user: User; token: string }> {
    const registered = await this.register(payload)
    if (registered.status !== 201) throw new Error(`Regisztracio sikertelen (${String(registered.status)})`)
    const { body } = await this.login({ email: payload.email, password: payload.password })
    return { client: this.withToken(body.data.token), user: body.data.user, token: body.data.token }
  }

  // Megjegyzes: az utvonalak elejen NINCS perjel, kulonben a WHATWG URL
  // feloldas levagna a baseURL /api/v1/ reszet.
  protected get<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
    return this.send<T>('GET', path, { params })
  }

  protected post<T>(path: string, data: unknown): Promise<ApiResult<T>> {
    return this.send<T>('POST', path, { data })
  }

  protected put<T>(path: string, data: unknown): Promise<ApiResult<T>> {
    return this.send<T>('PUT', path, { data })
  }

  protected patch<T>(path: string, data: unknown): Promise<ApiResult<T>> {
    return this.send<T>('PATCH', path, { data })
  }

  protected delete<T>(path: string): Promise<ApiResult<T>> {
    return this.send<T>('DELETE', path, {})
  }

  private async send<T>(method: string, path: string, options: { params?: Record<string, string>; data?: unknown }): Promise<ApiResult<T>> {
    const headers = this.token ? { Authorization: `Bearer ${this.token}` } : undefined
    return this.toResult<T>(await this.request.fetch(path, { method, headers, ...options }))
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
