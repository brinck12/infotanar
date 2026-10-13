/**
 * Vizsga (ExamSummary, ExamDetail), probalkozas (ExamAttempt), eredmeny (ExamResult) es az admin alakok.
 *
 * A fajl gazdaja a WP6 csomag. A frontend megfelelo tipusainak tukre
 * (frontend/src/features/exams/api.ts es frontend/src/features/admin/exams/api.ts);
 * a ../types.ts ujraexportalja, igy `import type { ... } from '../types'` formaban is elerheto.
 */
import type { Level } from '../types'

export type ExamMode = 'exam' | 'practice'
export type ExamAttemptState = 'in_progress' | 'submitted' | 'evaluated'

export interface ExamPartInfo {
  id: number
  order: number
  key: string
  name: string
  points: number
  minutes: number
}

export interface ExamAttemptSummary {
  id: number
  state: ExamAttemptState
  score: number | null
  max_score: number
  completed_parts: number[]
}

export interface ExamSummary {
  id: number
  session: string
  title: string
  level: Level
  minutes: number
  points: number
  parts: ExamPartInfo[]
  attempt: ExamAttemptSummary | null
}

export interface ExamFile {
  name: string
  size: number
  url: string
}

export interface ExamPartDetail extends ExamPartInfo {
  description: string
  steps: string[]
  sources: ExamFile[]
  deliverable: string | null
  accepted_extensions: string[]
  software: string | null
  exercise_id: number | null
}

export interface ExamDetail extends Omit<ExamSummary, 'parts'> {
  parts: ExamPartDetail[]
  source_zip: ExamFile | null
}

export interface ExamPartSubmission {
  part_id: number
  file_name: string
  uploaded_at: string
}

export interface ExamAttempt {
  id: number
  exam_id: number
  mode: ExamMode
  state: ExamAttemptState
  started_at: string
  deadline: string | null
  server_time: string
  submissions: ExamPartSubmission[]
}

export interface ExamPartResult {
  part_id: number
  score: number
  max_score: number
  summary: string | null
  file_submission_id: number | null
}

export interface ExamResult {
  attempt_id: number
  exam: ExamSummary
  score: number
  max_score: number
  pending_manual_points: number
  parts: ExamPartResult[]
  review: { lesson_id: number; title: string; track: string }[]
}

export type RubricStatus = 'complete' | 'incomplete' | 'tests'

export interface AdminExamPart {
  id: number
  order: number
  key: string
  name: string
  exercise_id: number | null
  exercise_title: string | null
  points: number
  minutes: number
  rubric_status: RubricStatus
  missing_points: number
}

export interface AdminExam {
  id: number
  session: string
  title: string
  level: Level
  minutes: number
  points: number
  is_published: boolean
  timed_mode: boolean
  parts: AdminExamPart[]
  files: { id: number; name: string; size: number; url: string }[]
}

/** Az admin vizsga torzse; a mezok szandekosan barmilyen ertekek lehetnek a validacio tesztelesehez. */
export interface AdminExamPayload {
  title: string
  level: string
  minutes: number
  points: number
  is_published: boolean
  timed_mode: boolean
  session?: string
}

export interface AdminExamPartPayload {
  key: string
  name: string
  exercise_id: number | null
  points: number
  minutes: number
}
