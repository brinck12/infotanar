import { http, type Envelope } from '../../../../shared/api/client'
import type { AdminLesson } from '../api'

/** Folyamatban levő, darabokban feltöltött videó (#158). */
export interface VideoUpload {
  id: string
  lesson_id: number
  filename: string
  size: number
  /** Egy darab mérete bájtban; az utolsó rövidebb lehet. */
  part_size: number
  total_parts: number
  /** A szerveren már megvan: a megszakadt feltöltés ezeket nem küldi újra. */
  received_parts: number[]
}

export async function beginVideoUpload(lessonId: number, file: File): Promise<VideoUpload> {
  return (await http.post<Envelope<VideoUpload>>(`/admin/lessons/${lessonId}/video/uploads`, { filename: file.name, size: file.size })).data.data
}

export async function videoUploadStatus(uploadId: string): Promise<VideoUpload> {
  return (await http.get<Envelope<VideoUpload>>(`/admin/lesson-uploads/${uploadId}`)).data.data
}

/** Egy darab nyers törzse; ugyanazt a darabot biztonságosan újra lehet küldeni. */
export async function putVideoPart(
  uploadId: string,
  part: number,
  bytes: Blob,
  options: { signal: AbortSignal; onProgress: (loadedBytes: number) => void },
): Promise<void> {
  await http.put(`/admin/lesson-uploads/${uploadId}/parts/${part}`, bytes, {
    headers: { 'Content-Type': 'application/octet-stream' },
    signal: options.signal,
    // Egy darab időkorlátja hosszabb az alapértelmezett 60 mp-nél: lassú vonalon 8 MB sok ideig tart.
    timeout: 5 * 60_000,
    onUploadProgress: (event) => options.onProgress(event.loaded),
  })
}

export async function completeVideoUpload(uploadId: string): Promise<AdminLesson> {
  // Az összefűzés és az ellenőrzés nagy fájlnál másodpercekig tarthat.
  return (await http.post<Envelope<AdminLesson>>(`/admin/lesson-uploads/${uploadId}/complete`, undefined, { timeout: 5 * 60_000 })).data.data
}

export async function abortVideoUpload(uploadId: string): Promise<void> {
  await http.delete(`/admin/lesson-uploads/${uploadId}`)
}

export async function removeLessonVideo(lessonId: number): Promise<AdminLesson> {
  return (await http.delete<Envelope<AdminLesson>>(`/admin/lessons/${lessonId}/video`)).data.data
}

export async function uploadLessonCaptions(lessonId: number, file: File): Promise<AdminLesson> {
  const body = new FormData()
  body.append('file', file)

  return (await http.post<Envelope<AdminLesson>>(`/admin/lessons/${lessonId}/captions`, body)).data.data
}

export async function removeLessonCaptions(lessonId: number): Promise<AdminLesson> {
  return (await http.delete<Envelope<AdminLesson>>(`/admin/lessons/${lessonId}/captions`)).data.data
}

/** Rövid életű, aláírt URL-ek az előnézethez (publikálatlan leckéhez is); felirat csak akkor van, ha a leckéhez tartozik. */
export interface VideoPreview {
  url: string
  captions_url: string | null
}

export async function videoPreviewUrl(lessonId: number): Promise<VideoPreview> {
  return (await http.get<Envelope<VideoPreview>>(`/admin/lessons/${lessonId}/video/preview`)).data.data
}
