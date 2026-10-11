/**
 * Admin csatolmany (AdminAttachment) es a feladat admin nezetenek uj mezoi.
 *
 * A fajl gazdaja a WP1 csomag. A frontend megfelelo tipusainak tukre
 * (frontend/src/types/index.ts es a features api.ts fajljai); a ../types.ts
 * ujraexportalja, igy `import type { ... } from '../types'` formaban is elerheto.
 */
import type { Level } from '../types'
import type { ExerciseKind } from './typedTasks'

/** Feladathoz csatolhato szerepek (a vizsga forras-zipje, a `source_zip`, kulon vegponton megy). */
export type AttachmentRole = 'source' | 'input' | 'sample_image' | 'sample_solution'

export interface AdminAttachment {
  id: number
  role: AttachmentRole | 'source_zip'
  name: string
  size: number
  /** Csak `input` szerepnel: a teszteset, amelynek a sajat bemenete. */
  test_case_id: number | null
  /** Alairt admin URL: minden szerepet letolt. */
  url: string
}

/** A kimenet osszehasonlitasanak modja (csak `code` fajtanal). */
export interface OutputComparison {
  mode: 'exact' | 'tokens' | 'numeric'
  case_insensitive: boolean
  ignore_accents: boolean
  ignore_blank_lines: boolean
  abs_tol: number | null
  rel_tol: number | null
}

/** A feladat az admin feluleten (GET/POST/PUT admin/exercises). */
export interface AdminExercise {
  id: number
  lesson_id: number
  position: number
  kind: ExerciseKind
  title: string
  description: string
  level: Level
  difficulty: number
  allowed_languages: string[]
  starter_code: Record<string, string>
  /** A fajtahoz tartozo adatok teljes alakban (a diaknak ki nem adott `raw_points`-szal egyutt). */
  spec: Record<string, unknown> | null
  comparison: OutputComparison | null
  is_published: boolean
  test_case_count?: number
  submission_count?: number
  rubric_item_count?: number
  /** Csak a reszletes nezetben (GET admin/exercises/{id}). */
  attachments?: AdminAttachment[]
}

/** Letrehozas es modositas torzse. Szandekosan laza, hogy a validacios hibak is tesztelhetok legyenek. */
export interface AdminExercisePayload {
  lesson_id?: number
  kind?: ExerciseKind | (string & {})
  title?: string
  description?: string
  level?: Level
  difficulty?: number
  allowed_languages?: string[]
  starter_code?: Record<string, string>
  spec?: Record<string, unknown> | null
  comparison?: Record<string, unknown> | null
  is_published?: boolean
}

export interface AdminTestCase {
  id: number
  exercise_id: number
  order: number
  stdin: string
  expected_stdout: string
  is_hidden: boolean
}
