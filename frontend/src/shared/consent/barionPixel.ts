import { env } from '../config/env'
import type { Consent } from './consentStore'

/**
 * A Barion Pixel alapkódja (#139, ADR 0001).
 *
 * A Barion a kereskedőktől elvárja az alap Pixelt (csalásmegelőzés); a
 * marketing célú felhasználáshoz a látogató kifejezett hozzájárulása kell,
 * amit a `grantConsent` / `rejectConsent` eseménnyel jelzünk.
 *
 * Két dolog függ a látogató döntésétől:
 *  - a betöltés: alapértelmezésben hozzájárulásig semmi nem töltődik be
 *    (`VITE_BARION_PIXEL_REQUIRES_CONSENT=false` esetén az alap Pixel a döntés
 *    előtt is betölt, ahogy a Barion leírja);
 *  - a hozzájárulás-esemény: mindig a tényleges döntést küldjük.
 */
type PixelQueue = ((...args: unknown[]) => void) & { q?: unknown[][]; l?: number }

declare global {
  interface Window {
    bp?: PixelQueue
    barion_pixel_id?: string
  }
}

const SCRIPT_URL = 'https://pixel.barion.com/bp.js'

/** Azonosító nélkül (fejlesztés, teszt) nincs miről dönteni: se Pixel, se süti-sáv. */
export const barionPixelEnabled = env.barionPixel.pixelId !== null

let loaded = false

/** A Barion saját betöltőkódja: a `bp` hívásokat sorba gyűjti, amíg a szkript megérkezik. */
function load(pixelId: string): void {
  const queue: PixelQueue = (...args: unknown[]) => {
    ;(queue.q ??= []).push(args)
  }
  queue.l = Date.now()
  window.bp = window.bp ?? queue

  const script = document.createElement('script')
  script.async = true
  script.src = SCRIPT_URL
  document.head.append(script)

  window.barion_pixel_id = pixelId
  window.bp('init', 'addBarionPixelId', pixelId)
  loaded = true
}

/** A Pixel állapotát a látogató döntéséhez igazítja; a döntés minden változásakor hívandó. */
export function syncBarionPixel(consent: Consent | null): void {
  const { pixelId, requiresConsent } = env.barionPixel

  if (!pixelId) return

  const mayLoad = consent === 'granted' || (!requiresConsent && consent !== 'rejected')
  if (mayLoad && !loaded) load(pixelId)

  if (loaded && consent) {
    window.bp?.('consent', consent === 'granted' ? 'grantConsent' : 'rejectConsent')
  }
}
