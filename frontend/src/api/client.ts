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

  if (error.response?.status === 429) {
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
