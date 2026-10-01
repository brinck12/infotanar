import { useSyncExternalStore } from 'react'

/**
 * A látogató süti-döntése (#139). A működéshez szükséges tárolás (belépés,
 * szerkesztő-piszkozat) nem kér hozzájárulást; ez a döntés a Barion Pixel
 * marketing célú adatkezeléséről szól.
 */
export type Consent = 'granted' | 'rejected'

const STORAGE_KEY = 'infotanar.consent'

/** Ha a hozzájárulás tárgya érdemben változik, a verzió léptetésével újra megkérdezzük a látogatót. */
const VERSION = 1

const listeners = new Set<() => void>()

/** Ha a localStorage nem elérhető (privát mód), a döntés a lap bezárásáig él. */
let memory: Consent | null = null

function read(): Consent | null {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (typeof stored !== 'object' || stored === null) return memory

    const { version, decision } = stored as { version?: unknown; decision?: unknown }

    return version === VERSION && (decision === 'granted' || decision === 'rejected') ? decision : memory
  } catch {
    return memory
  }
}

function write(decision: Consent | null): void {
  memory = decision
  try {
    if (decision) localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, decision }))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // A memóriabeli példány elég a munkamenet végéig.
  }
  listeners.forEach((notify) => notify())
}

export const consentStore = {
  /** `null`: a látogató még nem döntött. */
  get: read,
  set: (decision: Consent) => write(decision),
  /** A döntés törlése: a sáv újra megjelenik (lábléc: „Sütibeállítások"). */
  reset: () => write(null),
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useConsent(): Consent | null {
  return useSyncExternalStore(consentStore.subscribe, consentStore.get)
}
