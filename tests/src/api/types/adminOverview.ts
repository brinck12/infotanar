/**
 * Az admin attekinto valasza (GET admin/overview).
 *
 * A fajl gazdaja a WP9 csomag. A frontend megfelelo tipusainak tukre
 * (frontend/src/types/index.ts es a features api.ts fajljai); a ../types.ts
 * ujraexportalja, igy `import type { ... } from '../types'` formaban is elerheto.
 */

/** Egy naplozott muvelet az attekinto "legutobbi muveletek" listajaban. */
export interface AdminOverviewAction {
  id: number
  /** Az AuditAction erteke, pl. `catalog.created`. */
  action: string
  /** A muvelet magyar cimkeje. */
  label: string
  /** Aki a muveletet vegezte; `null`, ha a rendszer. */
  actor: { id: number; name: string } | null
  /** Az erintett elem morph aliasa (pl. `track`, `user`) es azonositoja; mindketto `null`, ha nincs alany. */
  subject_type: string | null
  subject_id: number | null
  /** ISO 8601 idopont. */
  created_at: string
}

export interface AdminOverview {
  /** A torolt fiokok nem szamitanak bele. */
  users: { total: number; unverified: number }
  /** Felhasznalok aktiv, illetve sikertelen megujitasu (past_due) elofizetessel. */
  subscribers: { active: number; past_due: number }
  /** Ugyanaz a szam, mint a GET admin/invoices `meta.total` erteke. */
  invoices: { attention: number }
  catalog: {
    tracks: number
    draft_tracks: number
    /** Hianyos ertekelolapu feladatok es vizsgareszek (feladatonkent egyszer szamolva). */
    incomplete_rubrics: number
    draft_exams: number
  }
  /** A legutobbi legfeljebb 10 muvelet, a legfrissebb elol. */
  recent_actions: AdminOverviewAction[]
}
