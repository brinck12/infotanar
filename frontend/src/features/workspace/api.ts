import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../shared/api/client'
import { saveBlob } from '../../shared/api/download'
import type { LessonVideo, RunRequest, RunResponse, SubmissionResponse } from '../../types'
import { catalogKeys } from '../catalog/api'
import { previewOf } from './filePreview'

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

async function fetchTaskFile(taskId: number, name: string, signal?: AbortSignal): Promise<Blob> {
  return (await http.get<Blob>(`/tasks/${taskId}/files/${encodeURIComponent(name)}`, { responseType: 'blob', signal })).data
}

/** A feladathoz mellékelt adatfájl első sorai (nyitás után gyorsítótárazva); null, ha nem UTF-8 szöveg. */
export const taskFilePreviewQuery = (taskId: number, name: string) =>
  queryOptions({
    queryKey: [...catalogKeys.task(taskId), 'file', name, 'preview'] as const,
    queryFn: async ({ signal }) => previewOf(await fetchTaskFile(taskId, name, signal)),
    staleTime: 10 * 60_000,
  })

/** Mellékelt adatfájl mentése a böngésző letöltéseként. */
export async function downloadTaskFile(taskId: number, name: string): Promise<void> {
  saveBlob(await fetchTaskFile(taskId, name), name)
}
