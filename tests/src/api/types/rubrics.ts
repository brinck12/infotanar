/**
 * Az ertekelolap egy pontja (RubricItem) es a szerkeszto keresei.
 *
 * A fajl gazdaja a WP3 csomag. A frontend megfelelo tipusainak tukre
 * (frontend/src/types/index.ts es a features api.ts fajljai); a ../types.ts
 * ujraexportalja, igy `import type { ... } from '../types'` formaban is elerheto.
 */

export type RubricMode = 'auto' | 'manual'

/** Az admin ertekelolap egy pontja (GET /admin/exercises/{exercise}/rubric-items). */
export interface AdminRubricItem {
  id: number
  exercise_id: number
  position: number
  label: string
  group: string
  check_type: string
  property: string
  expected: string
  points: number
  mode: RubricMode
  hint: string | null
  params?: Record<string, unknown>
}

/** Egy pont letrehozasanak / modositasanak kerese. */
export interface RubricItemInput {
  label: string
  group: string
  check_type: string
  property: string
  expected: string
  points: number
  mode: RubricMode
  hint: string | null
}
