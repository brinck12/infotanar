import axios, { AxiosError } from 'axios'
import { env } from '../config/env'
import { tokenStore } from './tokenStore'

export interface Envelope<T> {
  data: T
}

export const http = axios.create({
  baseURL: env.apiUrl,
  headers: { Accept: 'application/json' },
  // A kódfuttatás szinkron, több tesztesettel is elmehet fél percig.
  timeout: 60_000,
})

http.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Munkamenet közben lejárt vagy visszavont token (#136): a kérés tokent vitt,
 * mégis 401 jött. Az alkalmazás (AuthProvider) itt iratkozik fel, hogy
 * kijelentkeztesse a felhasználót és a belépéshez vigye.
 */
type SessionExpiredHandler = () => void

let sessionExpiredHandler: SessionExpiredHandler | null = null

/** A visszaadott függvény leiratkozik. */
export function onSessionExpired(handler: SessionExpiredHandler): () => void {
  sessionExpiredHandler = handler

  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = null
  }
}

/** Ezek 401-ét a hívó maga kezeli: a /auth/me csendben kijelentkeztet, a kijelentkezésnél a 401 nem hiba. */
const HANDLED_BY_CALLER = ['/auth/me', '/auth/logout']

/**
 * Csak akkor lejárt munkamenet, ha a kérés a MOSTANI tokent vitte. Így több
 * párhuzamos 401-ből csak az első jelez (utána a token már törölve van), és
 * egy közben újra belépett felhasználót sem léptetünk ki egy régi kérés miatt.
 */
function isExpiredSession(error: unknown): boolean {
  if (!(error instanceof AxiosError) || error.response?.status !== 401) return false
  if (HANDLED_BY_CALLER.includes(error.config?.url ?? '')) return false

  const token = tokenStore.get()

  return token !== null && error.config?.headers.Authorization === `Bearer ${token}`
}

http.interceptors.response.use(undefined, (error: unknown) => {
  if (isExpiredSession(error)) sessionExpiredHandler?.()

  return Promise.reject(error)
})
