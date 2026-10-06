import { AxiosError } from 'axios'
import { env } from '../config/env'
import { http } from './client'

/** Egy oldalbetöltés alatt legfeljebb ennyi jelentés megy: egy hibázó ciklus ne árassza el a szervert. */
const MAX_REPORTS_PER_PAGE_LOAD = 5

const alreadyReported = new Set<string>()

/**
 * Nem kezelt hiba jelentése a szervernek (#131), hogy a felhasználó gépén
 * történt összeomlásról is tudjunk. Csak éles buildben küld; ugyanazt a hibát
 * egyszer. A jelentés maga sosem dobhat hibát.
 */
export function reportError(error: unknown, componentStack?: string | null): void {
  if (!import.meta.env.PROD) return

  // A sikertelen API-hívásokat a felület maga kezeli és jelzi; a szerver a saját naplójában látja őket.
  if (error instanceof AxiosError) return

  const { message, stack } = describe(error)
  if (alreadyReported.has(message) || alreadyReported.size >= MAX_REPORTS_PER_PAGE_LOAD) return
  alreadyReported.add(message)

  void http
    .post('/client-errors', {
      message: message.slice(0, 500),
      url: window.location.href.slice(0, 500),
      stack: stack?.slice(0, 5000) ?? null,
      component_stack: componentStack?.slice(0, 5000) ?? null,
      release: env.release,
    })
    .catch(() => undefined)
}

function describe(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: `${error.name}: ${error.message}`, stack: error.stack }

  return { message: typeof error === 'string' ? error : 'Ismeretlen hiba (nem Error objektum)' }
}

/** A React fán kívüli hibák: eseménykezelők, időzítők, el nem kapott Promise-elutasítások. */
export function reportUnhandledErrors(): void {
  window.addEventListener('error', (event) => reportError(event.error ?? event.message))
  window.addEventListener('unhandledrejection', (event) => reportError(event.reason))
}
