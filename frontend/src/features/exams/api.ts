import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../shared/api/client'
import type { ExamPart as ExamPartFact } from '../../shared/domain/exam'
import type { Level } from '../../types'

/**
 * Gyakorló vizsgák. A végpontok a FRONTEND.md 11. fejezetének javaslatát
 * követik (`exams`, `exam_parts`, `exam_attempts`); a backend oldalon még
 * nincsenek meg, ezért az oldalak a 404-es választ „még nem elérhető”
 * állapotként kezelik, nem hibaként.
 */
export type ExamMode = 'exam' | 'practice'
export type AttemptState = 'in_progress' | 'submitted' | 'evaluated'

export interface ExamPartInfo {
  id: number
  order: number
  key: ExamPartFact['key']
  name: string
  points: number
  minutes: number
}

export interface ExamAttemptSummary {
  id: number
  state: AttemptState
  score: number | null
  max_score: number
  /** A már feltöltött (vagy beadott) részek sorszámai. */
  completed_parts: number[]
}

export interface ExamSummary {
  id: number
  /** Vizsgaidőszak, pl. `2026-05`. */
  session: string
  title: string
  level: Level
  minutes: number
  points: number
  parts: ExamPartInfo[]
  /** A tanuló legutóbbi próbálkozása; vendégnél és első alkalomnál `null`. */
  attempt: ExamAttemptSummary | null
}

export interface ExamFile {
  name: string
  size: number
  url: string
}

export interface ExamPartDetail extends ExamPartInfo {
  /** A feladat rövid leírása (Markdown). */
  description: string
  steps: string[]
  sources: ExamFile[]
  /** A beadandó fájl neve kiterjesztés nélkül, pl. `hyrox`. */
  deliverable: string | null
  accepted_extensions: string[]
  /** A munkaprogram neve, pl. „Excel / Calc”. */
  software: string | null
  /** Programozási résznél a szerkesztőben megoldandó feladat. */
  exercise_id: number | null
}

export interface ExamDetail extends Omit<ExamSummary, 'parts'> {
  parts: ExamPartDetail[]
  source_zip: ExamFile | null
}

export interface PartSubmission {
  part_id: number
  file_name: string | null
  uploaded_at: string | null
}

export interface ExamAttempt {
  id: number
  exam_id: number
  mode: ExamMode
  state: AttemptState
  started_at: string
  /** Vizsgahelyzetben a szerver szerinti határidő; gyakorlásnál `null`. */
  deadline: string | null
  submissions: PartSubmission[]
}

export interface PartResult {
  part_id: number
  score: number
  max_score: number
  /** A legfontosabb ok, amiért pont veszett el. */
  summary: string | null
  /** A fájlbeadás azonosítója az értékelőlaphoz. */
  file_submission_id: number | null
}

export interface ExamResult {
  attempt_id: number
  exam: ExamSummary
  /** Vizsgapont (az átváltás után, lefelé kerekítve). */
  score: number
  max_score: number
  pending_manual_points: number
  parts: PartResult[]
  review: Array<{ lesson_id: number; title: string; track: string }>
}

export const examKeys = {
  all: ['exams'] as const,
  list: () => [...examKeys.all, 'list'] as const,
  detail: (id: number) => [...examKeys.all, 'detail', id] as const,
  attempt: (id: number) => [...examKeys.all, 'attempt', id] as const,
  result: (id: number) => [...examKeys.all, 'result', id] as const,
}

export const examsQuery = () =>
  queryOptions({
    queryKey: examKeys.list(),
    queryFn: async ({ signal }) => (await http.get<Envelope<ExamSummary[]>>('/exams', { signal })).data.data,
    retry: false,
  })

export const examQuery = (id: number) =>
  queryOptions({
    queryKey: examKeys.detail(id),
    queryFn: async ({ signal }) => (await http.get<Envelope<ExamDetail>>(`/exams/${id}`, { signal })).data.data,
    retry: false,
  })

export const attemptQuery = (id: number) =>
  queryOptions({
    queryKey: examKeys.attempt(id),
    queryFn: async ({ signal }) => (await http.get<Envelope<ExamAttempt>>(`/exam-attempts/${id}`, { signal })).data.data,
    retry: false,
  })

export const resultQuery = (attemptId: number) =>
  queryOptions({
    queryKey: examKeys.result(attemptId),
    queryFn: async ({ signal }) => (await http.get<Envelope<ExamResult>>(`/exam-attempts/${attemptId}/result`, { signal })).data.data,
    retry: false,
  })

export async function startAttempt(examId: number, mode: ExamMode): Promise<ExamAttempt> {
  return (await http.post<Envelope<ExamAttempt>>(`/exams/${examId}/attempts`, { mode })).data.data
}

export async function uploadPartFile(
  attemptId: number,
  partId: number,
  file: File,
  onProgress: (percent: number) => void,
): Promise<ExamAttempt> {
  const body = new FormData()
  body.append('file', file)
  const response = await http.post<Envelope<ExamAttempt>>(`/exam-attempts/${attemptId}/parts/${partId}/file`, body, {
    onUploadProgress: (event) => onProgress(event.total ? (event.loaded / event.total) * 100 : 0),
  })
  return response.data.data
}

export async function submitAttempt(attemptId: number): Promise<ExamAttempt> {
  return (await http.post<Envelope<ExamAttempt>>(`/exam-attempts/${attemptId}/submit`)).data.data
}
