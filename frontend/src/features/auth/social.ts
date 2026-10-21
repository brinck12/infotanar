import * as authApi from './api'

const STORAGE_KEY = 'infotanar.google.login'

interface PendingLogin {
  verifier: string
  /** Ahová a sikeres belépés után vissza kell térni (a Google-oldal után a router állapota elveszik). */
  from?: string
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/** Base64url(SHA-256(verifier)): a szerver ezt köti a Google-folyamathoz (PKCE, S256). */
async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}

/** Csak helyi útvonalra engedünk visszatérni, nehogy a tárolt érték külső címre vigyen. */
function safePath(path: string | undefined): string | undefined {
  return path !== undefined && path.startsWith('/') && !path.startsWith('//') ? path : undefined
}

/**
 * Elindítja a Google-belépést: titkos verifiert tart a böngészőben, a hash-ét
 * elküldi a szervernek, és visszaadja a Google belépőoldalának címét.
 *
 * @throws Error ha a böngésző nem engedi a tárolást: a visszatérés után nem lenne meg a verifier.
 */
export async function beginGoogleLogin(from?: string): Promise<string> {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)))
  const pending: PendingLogin = from === undefined ? { verifier } : { verifier, from }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
  } catch {
    throw new Error('A böngésződ nem engedi a Google-belépéshez szükséges tárolást. Lépj be e-mail-címmel.')
  }

  return authApi.googleRedirect(await challengeFor(verifier))
}

export function pendingGoogleLogin(): { verifier: string; from: string | undefined } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || !('verifier' in parsed) || typeof parsed.verifier !== 'string') return null
    const from = 'from' in parsed && typeof parsed.from === 'string' ? safePath(parsed.from) : undefined
    return { verifier: parsed.verifier, from }
  } catch {
    return null
  }
}

export function clearPendingGoogleLogin(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nincs mit törölni, ha a tárhely nem elérhető.
  }
}
