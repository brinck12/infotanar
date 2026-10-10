/**
 * Egy szóbeli tétel gyakorlásának állapota a böngészőben, felhasználónként és
 * témánként: kipipált vázlatpontok, jegyzet, önértékelés és a gyakorlások száma.
 */
export interface OralPractice {
  checked: number[]
  notes: string
  /** A három önértékelt szempont pontja (0–4), a szempont nevével kulcsolva. */
  scores: Record<string, number>
  attempts: number
}

export const EMPTY_PRACTICE: OralPractice = { checked: [], notes: '', scores: {}, attempts: 0 }

export const practiceKey = (userKey: string, slug: string) => `infotanar.oral.v1.${userKey}.${slug}`

export function isOralPractice(value: unknown): value is OralPractice {
  if (typeof value !== 'object' || value === null) return false
  const practice = value as Partial<OralPractice>
  return (
    Array.isArray(practice.checked) &&
    practice.checked.every((item) => typeof item === 'number') &&
    typeof practice.notes === 'string' &&
    typeof practice.scores === 'object' &&
    practice.scores !== null &&
    typeof practice.attempts === 'number'
  )
}

export function readPractice(userKey: string, slug: string): OralPractice {
  try {
    const raw = localStorage.getItem(practiceKey(userKey, slug))
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    return isOralPractice(parsed) ? parsed : EMPTY_PRACTICE
  } catch {
    return EMPTY_PRACTICE
  }
}

/** `mm:ss` */
export function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds)
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}
