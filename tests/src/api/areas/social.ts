/**
 * Google-belepes (GET /auth/providers, POST /auth/google/{redirect,exchange,complete}, GET /auth/google/callback).
 *
 * A folyamat a bongeszoben egy teljes korbol all (alkalmazas -> Google -> backend -> frontend); itt a bongeszo
 * nelkul jatsszuk vegig: a Google-mock (src/mocks/google) adja a "Google"-t, az atiranyitasokat kezzel koveti
 * a `goThroughGoogle`. A bongeszoben tartott titkot (verifier) es annak hash-et (challenge) a `pkce` allitja elo.
 */
import { createHash, randomBytes } from 'node:crypto'
import type { ApiClient, ApiResult } from '../ApiClient'
import type { GoogleIdentity, GoogleStub } from '../../mocks/google/GoogleStub'
import type { DataEnvelope, LoginResponse, User } from '../types'

/** A bongeszo titka (verifier) es a szervernek elkuldott hash-e (challenge, S256). */
export interface Pkce {
  verifier: string
  challenge: string
}

function base64Url(buffer: Buffer): string {
  return buffer.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/** Friss verifier es challenge-par: 43 karakteresek, ahogy a bongeszo is eloallitja oket. */
export function pkce(): Pkce {
  const verifier = base64Url(randomBytes(32))
  return { verifier, challenge: base64Url(createHash('sha256').update(verifier).digest()) }
}

/** A kodvaltas valasza: azonnali belepes, vagy uj fiok eseten a hozzajarulasra varo profil. */
export type GoogleExchange = ({ status: 'signed_in' } & LoginResponse) | { status: 'consent_required'; name: string; email: string }

export interface GoogleCompletePayload {
  code: string
  code_verifier: string
  accept_terms: boolean
  terms_version: string
  privacy_version: string
  invite_code?: string
}

export function authProviders(client: ApiClient): Promise<ApiResult<DataEnvelope<{ google: boolean }>>> {
  return client.get('auth/providers')
}

/** A challenge szandekosan barmi lehet, hogy az ervenytelen alak is tesztelheto legyen. */
export function googleRedirect(client: ApiClient, challenge: string): Promise<ApiResult<DataEnvelope<{ url: string }>>> {
  return client.post('auth/google/redirect', { code_challenge: challenge })
}

export function googleExchange(client: ApiClient, code: string, verifier: string): Promise<ApiResult<DataEnvelope<GoogleExchange>>> {
  return client.post('auth/google/exchange', { code, code_verifier: verifier })
}

/** Az elfogadas es a verziok alapbol ervenyesek; a felulirt mezokkel a hibaagak probalhatok. */
export function googleComplete(
  client: ApiClient,
  code: string,
  verifier: string,
  overrides: Partial<GoogleCompletePayload> = {}
): Promise<ApiResult<DataEnvelope<LoginResponse>>> {
  const payload: GoogleCompletePayload = {
    code,
    code_verifier: verifier,
    accept_terms: true,
    terms_version: '0.1',
    privacy_version: '0.1',
    ...overrides,
  }
  return client.post('auth/google/complete', payload)
}

/** Ahova a backend a Google-rol visszatero bongeszot iranyitja: a frontend `/belepes/google` oldala. */
export interface GoogleReturn {
  /** Egyszer hasznalhato kod, siker eseten. */
  code: string | null
  /** `cancelled` vagy `failed`, hiba eseten. */
  error: string | null
  landing: URL
  pkce: Pkce
}

/**
 * A teljes Google-kor bongeszo nelkul: a challenge elkuldese, az atiranyitas a Google-hoz (a mock), a
 * visszateres a backend callbackjere, majd a backend atiranyitasa a frontendre. A Google-mockot elotte be
 * kell allitani (`googleStub.signInAs()` vagy `denyNext()`).
 */
export async function goThroughGoogle(client: ApiClient, pair: Pkce = pkce()): Promise<GoogleReturn> {
  const redirect = await googleRedirect(client, pair.challenge)
  if (redirect.status !== 200) throw new Error(`A Google-atiranyitas sikertelen (${String(redirect.status)})`)

  const toGoogle = await client.getWithoutRedirect(redirect.body.data.url)
  if (!toGoogle.location) throw new Error('A Google-mock nem iranyitott vissza')

  const callback = await client.getWithoutRedirect(toGoogle.location)
  if (!callback.location) throw new Error('A backend callback nem iranyitott a frontendre')

  const landing = new URL(callback.location)
  return { code: landing.searchParams.get('code'), error: landing.searchParams.get('error'), landing, pkce: pair }
}

/** Egy sikeres Google-kor utan a kod; hibat dob, ha a kor megszakadt. */
export async function googleCode(client: ApiClient, pair: Pkce = pkce()): Promise<{ code: string; pkce: Pkce }> {
  const returned = await goThroughGoogle(client, pair)
  if (!returned.code) throw new Error(`A Google-kor nem adott kodot (hiba: ${returned.error ?? 'nincs'})`)
  return { code: returned.code, pkce: returned.pkce }
}

/** A kodvaltas "belepett" ag: a token es a felhasznalo; hibat dob, ha a szerver hozzajarulast kert. */
export function signedInOf(exchange: GoogleExchange): LoginResponse {
  if (exchange.status !== 'signed_in') throw new Error('Nem belepes jott, hanem hozzajarulas-kerés')
  return exchange
}

/** A kodvaltas "uj fiok" ag: a Google profilja; hibat dob, ha a szerver mar belepteti a felhasznalot. */
export function consentRequiredOf(exchange: GoogleExchange): { name: string; email: string } {
  if (exchange.status !== 'consent_required') throw new Error('Nem hozzajarulas-kerés jott, hanem belepes')
  return exchange
}

/** Egy Google-fiokkal nyitott, bejelentkezett felhasznalo. */
export interface GoogleAccount {
  identity: GoogleIdentity
  client: ApiClient
  user: User
  token: string
}

/**
 * Uj fiok nyitasa Google-lel a teljes uton (engedelykeres, kodvaltas, hozzajarulas). A Google-mockot ez allitja be
 * a megadott (vagy friss) azonossaggal. Hibat dob, ha a szerver barmelyik lepesnel elutasit.
 */
export async function signUpWithGoogle(client: ApiClient, stub: GoogleStub, overrides: Partial<GoogleIdentity> = {}): Promise<GoogleAccount> {
  const identity = await stub.signInAs(overrides)
  const { code, pkce: pair } = await googleCode(client)

  const exchanged = await googleExchange(client, code, pair.verifier)
  consentRequiredOf(exchanged.body.data)

  const completed = await googleComplete(client, code, pair.verifier)
  if (completed.status !== 200) throw new Error(`A Google-fiok nyitasa sikertelen (${String(completed.status)})`)

  const { token, user } = completed.body.data
  return { identity, client: client.withToken(token), user, token }
}
