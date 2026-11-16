import { useSyncExternalStore } from 'react'
import { readStoredJson, removeStored, writeStoredJson } from '../domain/localStore'

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

interface StoredConsent {
  version: number
  decision: Consent
}

function isStoredConsent(value: unknown): value is StoredConsent {
  if (typeof value !== 'object' || value === null) return false
  const { version, decision } = value as { version?: unknown; decision?: unknown }

  return version === VERSION && (decision === 'granted' || decision === 'rejected')
}

function read(): Consent | null {
  return readStoredJson(STORAGE_KEY, isStoredConsent)?.decision ?? memory
}

function write(decision: Consent | null): void {
  memory = decision
  if (decision) writeStoredJson(STORAGE_KEY, { version: VERSION, decision } satisfies StoredConsent)
  else removeStored(STORAGE_KEY)
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
