import { AxiosError } from 'axios'
import type { LockedErrorResponse, LockReason, ValidationErrorResponse } from '../../types'

export function httpStatus(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined
}

/**
 * A backend hibáiból olvasható magyar üzenetet állít elő. A backend minden
 * hibára magyar `message`-et ad; ezt használjuk, ha van.
 * Validációs hibánál (422) az első mezőhibát adja vissza.
 */
export function hibaUzenet(error: unknown): string {
  if (!(error instanceof AxiosError)) {
    return 'Váratlan hiba történt.'
  }

  if (error.code === 'ECONNABORTED') {
    return 'A kérés túl sokáig tartott, próbáld újra.'
  }

  if (!error.response) {
    return 'A szerver nem elérhető. Ellenőrizd az internetkapcsolatot, és próbáld újra.'
  }

  const data = error.response.data as Partial<ValidationErrorResponse> | undefined

  if (error.response.status === 422 && data?.errors) {
    const first = Object.values(data.errors)[0]?.[0]
    if (first) return first
  }

  if (typeof data?.message === 'string' && data.message !== '') {
    return data.message
  }

  return 'Váratlan hiba történt a szerveren.'
}

const LOCK_REASONS: ReadonlySet<string> = new Set<LockReason>(['login_required', 'email_unverified', 'subscription_required'])

/** Zárolt (fizetős) tartalom miatti 401/403 válasz, ha az volt a hiba oka. */
export function zarolasOka(error: unknown): LockedErrorResponse | null {
  if (!(error instanceof AxiosError)) return null
  const data = error.response?.data as Partial<LockedErrorResponse> | undefined
  if (!data?.reason || !LOCK_REASONS.has(data.reason) || typeof data.message !== 'string') return null
  return { reason: data.reason, message: data.message }
}

/** Kódfuttatásnál várni kell: a néző elérte a percenkénti keretét, vagy a futtató túlterhelt. */
export interface ExecutionWait {
  reason: 'rate_limited' | 'busy'
  seconds: number
  /** Vendég: bejelentkezve magasabb a keret. */
  guest: boolean
}

/**
 * A futtatás 429 / 503 válasza, ha rövid várakozás után újra lehet próbálni.
 * A napi keret elérése nem ilyen: annak a szerver üzenete jelenik meg.
 */
export function varakozas(error: unknown): ExecutionWait | null {
  if (!(error instanceof AxiosError)) return null
  const data = error.response?.data as { reason?: unknown; retry_after?: unknown; guest?: unknown } | undefined

  if ((data?.reason !== 'rate_limited' && data?.reason !== 'busy') || typeof data.retry_after !== 'number') return null

  return { reason: data.reason, seconds: data.retry_after, guest: data.guest === true }
}

/** 422-es válasznál mezőnként az első hibaüzenet, hogy a mező alatt jelenhessen meg. */
export function mezoHibak(error: unknown): Record<string, string> {
  if (!(error instanceof AxiosError) || error.response?.status !== 422) return {}
  const errors = (error.response.data as Partial<ValidationErrorResponse> | undefined)?.errors ?? {}
  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, messages]) => (messages[0] ? [[field, messages[0]]] : [])),
  )
}
