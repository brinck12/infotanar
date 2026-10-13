/**
 * A haladas es az adatexport uj mezoi.
 *
 * A fajl gazdaja a WP8 csomag. A frontend megfelelo tipusainak tukre
 * (frontend/src/types/index.ts es a features api.ts fajljai); a ../types.ts
 * ujraexportalja, igy `import type { ... } from '../types'` formaban is elerheto.
 */

/** A feladat allapota a nezo szemszogebol; vendegnel hianyzik, erintetlen feladatnal null. */
export type ProgressTaskStatus = 'solved' | 'attempted' | null

export interface TaskStatusDetail {
  id: number
  my_status?: ProgressTaskStatus
}

export interface ProgressLesson {
  id: number
  status: 'not_started' | 'in_progress' | 'completed'
}

export interface ProgressReport {
  overall: { completed: number; total: number; percent: number }
  tracks: { id: number; lessons: ProgressLesson[] }[]
}

export interface ExportedFileSubmission {
  id: number
  exercise: { id: number; title: string }
  attempt: number
  file_name: string
  size: number
  status: string
  score: number
  max_score: number
  passed: boolean
  exam_attempt_id: number | null
  submitted_at: string | null
  result: unknown
}

export interface ExportedExamAttempt {
  id: number
  exam: { id: number; title: string; level: string }
  mode: string
  state: string
  started_at: string
  submitted_at: string | null
  score: number | null
  max_score: number | null
  parts: unknown[]
}

/** Az `GET /account/export` valaszanak a WP8 altal hozzaadott resze. */
export interface AccountExportPrivacy {
  preferences: Record<string, unknown> | null
  oral_practice: { topic: string; checked: number[]; notes: string; scores: Record<string, number>; attempts: number; last_practiced_at: string | null }[]
  file_submissions: ExportedFileSubmission[]
  exam_attempts: ExportedExamAttempt[]
}
