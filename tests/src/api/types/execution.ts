/**
 * A futtatas es a beadas uj mezoi: subtasks, osszehasonlitasi modok.
 *
 * A fajl gazdaja a WP2 csomag. A frontend megfelelo tipusainak tukre
 * (frontend/src/types/index.ts es a features api.ts fajljai); a ../types.ts
 * ujraexportalja, igy `import type { ... } from '../types'` formaban is elerheto.
 */
import type { RunResponse, TestResult } from '../types'

/** Reszfeladatonkenti pontozas (frontend: `SubtaskScore`). */
export interface ExecutionSubtaskScore {
  label: string
  points: number
  max_points: number
  passed: boolean
  /** "Várt: ..., kapott: ..."; null, ha a resz jo, vagy ha rejtett teszteset is hibas. */
  note: string | null
}

/** Egy teszteset eredmenye az itelettel egyutt. */
export interface ExecutionTestResult extends TestResult {
  verdict: string
  verdict_label: string
  /** Az elso elteres leirasa: csak elemenkenti osszevetesnel, hibas kimenetu LATHATO tesztesetnel. */
  difference?: string
}

/** A `POST /run` valasza (frontend: `RunResponse`). */
export interface ExecutionRunResponse extends Omit<RunResponse, 'results'> {
  verdict: string
  verdict_label: string
  results: ExecutionTestResult[]
  /** Csak reszfeladatonkent pontozott feladatnal; kulonben a kulcs is hianyzik. */
  subtasks?: ExecutionSubtaskScore[]
}

/** A `POST /submissions` valasza (frontend: `SubmissionResponse`). */
export interface ExecutionSubmissionResponse extends ExecutionRunResponse {
  submission_id: number
  lesson_completed: boolean
}

/** Az `exercises.comparison` beallitas (admin feladat-szerkeszto). */
export interface ExecutionComparison {
  mode: 'exact' | 'tokens' | 'numeric'
  abs_tol?: number
  rel_tol?: number
  case_insensitive?: boolean
  ignore_accents?: boolean
  ignore_blank_lines?: boolean
}
