/**
 * Fajlbeadas (FileSubmission): csoportok, pontok, tenyek.
 *
 * A fajl gazdaja a WP3 csomag. A frontend megfelelo tipusainak tukre
 * (frontend/src/types/index.ts es a features api.ts fajljai); a ../types.ts
 * ujraexportalja, igy `import type { ... } from '../types'` formaban is elerheto.
 */

export type FileSubmissionStatus = 'processing' | 'evaluated' | 'failed'

/** Egy pont allapota: teljesult, nem teljesult, vagy a diak jelolheti (kezi). */
export type FileItemState = 'ok' | 'bad' | 'manual'

export interface FileSubmissionItem {
  rubric_item_id: number
  group: string
  label: string
  state: FileItemState
  points: number
  max_points: number
  found: string | null
  hint: string | null
  manual_mark: boolean | null
}

export interface FileSubmissionGroup {
  name: string
  score: number
  max_score: number
}

export interface FileSubmissionFact {
  label: string
  value: string
}

export interface FileSubmission {
  id: number
  exercise_id: number
  exercise_title: string
  attempt: number
  status: FileSubmissionStatus
  score: number
  max_score: number
  previous_score: number | null
  file: { name: string; size: number; uploaded_at: string }
  groups: FileSubmissionGroup[]
  items: FileSubmissionItem[]
  facts: FileSubmissionFact[]
  preview_url: string | null
  sample_url: string | null
  error: string | null
}
