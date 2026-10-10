import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../shared/api/client'
import type { RubricState } from '../../shared/ui/RubricItem'
import type { ExerciseKind } from '../../types'

/**
 * Fájlbeadások és értékelőlap. A végpontok a FRONTEND.md 11. fejezetének
 * javaslatát követik (`file-submissions`, `rubric_items`); a backend oldalon
 * még nincsenek meg.
 */
export interface RubricResult {
  rubric_item_id: number
  group: string
  label: string
  state: RubricState
  points: number
  max_points: number
  /** Amit az ellenőrző a fájlban talált. */
  found: string | null
  hint: string | null
  /** Kézi tételnél a tanuló jelölése; `null`, amíg nem döntött. */
  manual_mark: boolean | null
}

export interface RubricGroup {
  name: string
  score: number
  max_score: number
}

export interface FileSubmission {
  id: number
  exercise_id: number
  exercise_title: string
  /** Hányadik próbálkozás ez a feladatnál. */
  attempt: number
  status: 'processing' | 'evaluated' | 'failed'
  score: number
  max_score: number
  /** Az előző próbálkozás pontszáma, ha volt. */
  previous_score: number | null
  file: { name: string; size: number; uploaded_at: string }
  groups: RubricGroup[]
  items: RubricResult[]
  /** Dokumentumnál: amit a fájlban találtunk (lapméret, margók, stílusok…). */
  facts: Array<{ label: string; value: string }>
  /** A feltöltött munka és a minta előnézete, ha a szerver le tudta képezni. */
  preview_url: string | null
  sample_url: string | null
  /** Sikertelen feldolgozásnál az ok. */
  error: string | null
}

export const fileTaskKeys = {
  all: ['file-submissions'] as const,
  one: (id: number) => [...fileTaskKeys.all, 'one', id] as const,
  forExercise: (exerciseId: number) => [...fileTaskKeys.all, 'exercise', exerciseId] as const,
}

const UPLOAD_KINDS: ReadonlySet<ExerciseKind> = new Set(['sheet_upload', 'doc_upload', 'visual_upload'])

export function isUploadKind(kind: ExerciseKind | undefined): boolean {
  return kind !== undefined && UPLOAD_KINDS.has(kind)
}

export const submissionQuery = (id: number) =>
  queryOptions({
    queryKey: fileTaskKeys.one(id),
    queryFn: async ({ signal }) => (await http.get<Envelope<FileSubmission>>(`/file-submissions/${id}`, { signal })).data.data,
    retry: false,
  })

/** A feladat próbálkozásai, a legújabb elöl. */
export const submissionsQuery = (exerciseId: number) =>
  queryOptions({
    queryKey: fileTaskKeys.forExercise(exerciseId),
    queryFn: async ({ signal }) =>
      (await http.get<Envelope<FileSubmission[]>>(`/exercises/${exerciseId}/file-submissions`, { signal })).data.data,
    retry: false,
  })

export async function uploadSubmission(exerciseId: number, file: File, onProgress: (percent: number) => void): Promise<FileSubmission> {
  const body = new FormData()
  body.append('file', file)
  const response = await http.post<Envelope<FileSubmission>>(`/exercises/${exerciseId}/file-submissions`, body, {
    onUploadProgress: (event) => onProgress(event.total ? (event.loaded / event.total) * 100 : 0),
  })
  return response.data.data
}

/** A kézi tételek jelölése: tételazonosító → megvan-e. */
export async function saveManualMarks(submissionId: number, marks: Record<number, boolean>): Promise<FileSubmission> {
  return (await http.put<Envelope<FileSubmission>>(`/file-submissions/${submissionId}/manual`, { marks })).data.data
}
