/**
 * Tanulasi celok (Preferences) es szobeli gyakorlas (OralPractice).
 *
 * A fajl gazdaja a WP7 csomag. A frontend megfelelo tipusainak tukre
 * (frontend/src/shared/domain/preferences.ts es features/oral/practice.ts); a
 * ../types.ts ujraexportalja, igy `import type { ... } from '../types'`
 * formaban is elerheto.
 */

/**
 * A tanulo celjai, ahogy a halozaton utaznak: snake_case kulcsokkal (a frontend
 * `StudyPreferences` tipusa ugyanez camelCase-ben).
 */
export interface StudyPreferences {
  level: 'kozep' | 'emelt'
  /** A config/learning.php `exam_periods` egyik erteke, pl. `2027-05`. */
  exam_period: string
  language: 'python' | 'csharp'
  weekly_hours: '1-2' | '3-4' | '5+'
}

/** Amit a kliens egy szobeli temakorrol ment: a teljes allapot, a szamlalo nelkul. */
export interface OralPracticeInput {
  /** A kipipalt vazlatpontok indexei (0..29), ismetles nelkul. */
  checked: number[]
  notes: string
  /** Onertekeles: szempont neve -> 0..4 pont. */
  scores: Record<string, number>
}

/** Egy temakor gyakorlasi allapota a valaszban: a frontend `OralPractice` tipusa es a temakor. */
export interface OralPractice extends OralPracticeInput {
  topic: string
  attempts: number
  last_practiced_at: string | null
}
