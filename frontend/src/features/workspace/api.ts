import { http, type Envelope } from '../../shared/api/client'
import type { LessonVideo, RunRequest, RunResponse, SubmissionResponse } from '../../types'

/** "Futtatás": csak a nyilvános teszteseteken fut, nem mentődik. */
export async function runCode(payload: RunRequest): Promise<RunResponse> {
  return (await http.post<RunResponse>('/run', payload)).data
}

/** "Beadás": minden teszteseten fut, és mentődik. */
export async function submitCode(payload: RunRequest): Promise<SubmissionResponse> {
  return (await http.post<SubmissionResponse>('/submissions', payload)).data
}

/** Aláírt, rövid életű videó-URL; lejárat után (pl. hosszú szünet) újra kell kérni. */
export async function lessonVideo(lessonId: number, signal?: AbortSignal): Promise<LessonVideo> {
  return (await http.get<Envelope<LessonVideo>>(`/lessons/${lessonId}/video`, { signal })).data.data
}
