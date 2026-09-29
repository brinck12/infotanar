import axios, { AxiosError } from 'axios'
import type {
  RunRequest,
  RunResponse,
  SubmissionResponse,
  TaskDetail,
  TaskListItem,
  Topic,
  ValidationErrorResponse,
} from '../types'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api/v1'

export const client = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
  // A kódfuttatás szinkron, több tesztesettel is elmehet fél percig.
  timeout: 60_000,
})

/**
 * A backend hibáiból olvasható magyar üzenetet állít elő.
 * Validációs hibánál (422) az első mezőhibát adja vissza.
 */
export function hibaUzenet(error: unknown): string {
  if (!(error instanceof AxiosError)) {
    return 'Váratlan hiba történt.'
  }

  if (error.code === 'ECONNABORTED') {
    return 'A futtatás túl sokáig tartott, próbáld újra.'
  }

  const data = error.response?.data as Partial<ValidationErrorResponse & RunResponse> | undefined

  if (error.response?.status === 422 && data?.errors) {
    const first = Object.values(data.errors)[0]
    if (first?.length) {
      return first[0]
    }
  }

  // A futtatás limitje a Laravel alap (angol) üzenetét adja, a többi limiter magyarul válaszol.
  if (error.response?.status === 429) {
    if (typeof data?.message === 'string' && data.message !== '' && data.message !== 'Too Many Attempts.') {
      return data.message
    }
    return 'Túl sok futtatás rövid idő alatt. Várj egy percet, és próbáld újra.'
  }

  if (typeof data?.message === 'string' && data.message !== '') {
    return data.message
  }

  if (!error.response) {
    return 'A szerver nem elérhető. Fut a backend?'
  }

  return 'Váratlan hiba történt a szerveren.'
}

/** 422-es válasznál mezőnként az első hibaüzenet, hogy a mező alatt jelenhessen meg. */
export function mezoHibak(error: unknown): Record<string, string> {
  if (!(error instanceof AxiosError) || error.response?.status !== 422) return {}
  const errors = (error.response.data as Partial<ValidationErrorResponse> | undefined)?.errors ?? {}
  return Object.fromEntries(
    Object.entries(errors)
      .filter(([, messages]) => messages.length > 0)
      .map(([field, messages]) => [field, messages[0]]),
  )
}

const TOKEN_KEY = 'infotanar.token'

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string | null): void {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Privát módban a localStorage tilthatja az írást; ilyenkor csak a munkamenet végéig vagyunk bent.
    }
  },
}

client.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface Envelope<T> {
  data: T
}

export async function getTopics(): Promise<Topic[]> {
  const { data } = await client.get<Envelope<Topic[]>>('/topics')
  return data.data
}

export async function getTasks(params: { topic?: string; level?: string } = {}): Promise<TaskListItem[]> {
  const query: Record<string, string> = {}
  if (params.topic) query.topic = params.topic
  if (params.level) query.level = params.level

  const { data } = await client.get<Envelope<TaskListItem[]>>('/tasks', { params: query })
  return data.data
}

export async function getTask(id: number): Promise<TaskDetail> {
  const { data } = await client.get<Envelope<TaskDetail>>(`/tasks/${id}`)
  return data.data
}

/** "Futtatás": csak a nyilvános teszteseteken fut, nem mentődik. */
export async function runCode(payload: RunRequest): Promise<RunResponse> {
  const { data } = await client.post<RunResponse>('/run', payload)
  return data
}

/** "Beadás": minden teszteseten fut, és mentődik. */
export async function submitCode(payload: RunRequest): Promise<SubmissionResponse> {
  const { data } = await client.post<SubmissionResponse>('/submissions', payload)
  return data
}
