/**
 * A build-idejű környezet egyetlen, ellenőrzött belépési pontja. Hibás
 * konfigurációnál már induláskor érthető hibát kapunk, nem egy félresikerült
 * kérésnél.
 */
function readApiUrl(): string {
  const raw: unknown = import.meta.env.VITE_API_URL
  const value = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : 'http://127.0.0.1:8000/api/v1'

  // Relatív útvonal (pl. "/api/v1") éles környezetben, ahol az nginx proxyzza az API-t.
  if (!value.startsWith('/') && !/^https?:\/\//.test(value)) {
    throw new Error(`Érvénytelen VITE_API_URL: "${value}" (http(s):// vagy / kezdetű legyen)`)
  }

  return value.replace(/\/+$/, '')
}

/** A build git commitja (a deploy állítja be); a hibajelentésekből így látszik, melyik kiadás hibázott. */
function readRelease(): string | null {
  const raw: unknown = import.meta.env.VITE_RELEASE

  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : null
}

/**
 * Barion Pixel (#139). Azonosító nélkül a Pixel ki van kapcsolva. Alapértelmezésben
 * csak a látogató hozzájárulása után töltődik be; `VITE_BARION_PIXEL_REQUIRES_CONSENT=false`
 * esetén az alap Pixel a döntés előtt is betölt.
 */
function readBarionPixel(): { pixelId: string | null; requiresConsent: boolean } {
  const id: unknown = import.meta.env.VITE_BARION_PIXEL_ID

  return {
    pixelId: typeof id === 'string' && id.trim() !== '' ? id.trim() : null,
    requiresConsent: import.meta.env.VITE_BARION_PIXEL_REQUIRES_CONSENT !== 'false',
  }
}

export const env = Object.freeze({
  apiUrl: readApiUrl(),
  release: readRelease(),
  barionPixel: readBarionPixel(),
})
