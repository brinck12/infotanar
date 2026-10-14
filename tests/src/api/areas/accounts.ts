import { DEFAULT_PASSWORD, registration, SEEDED } from '../../data'
import type { ApiClient } from '../ApiClient'
import type { User } from '../types'

/** Egy bejelentkezett fiok: tokenes kliens, a felhasznalo es a token. */
export interface Account {
  client: ApiClient
  user: User
  token: string
}

/** A rogzitett admin tokenje a munkafolyamaton (worker) belul, a spec fajlok kozott megosztva. */
let adminSession: { token: string; user: User } | undefined

/**
 * A rogzitett admin fiok tokenes kliense.
 *
 * A bejelentkezes fiokonkent es IP-nkent percenkent 5-re korlatozott, es az
 * API projekt egyetlen munkafolyamatban, sorban futtatja a spec fajlokat. Ha
 * mindegyik maga lepne be, a kozos admin fiok kifutna a keretbol. Ezert a
 * token egyszer keszul el, es minden hivo ugyanazt kapja; ha kozben
 * ervenytelenne valt (pl. egy teszt visszavonta az admin munkameneteit), a
 * fuggveny ujra belep.
 *
 * Barhonnan hivhato (`beforeAll`-bol vagy tesztbol), mert az eredmeny a
 * hivo sajat `apiClient`-jere epul.
 */
export async function adminAccount(apiClient: ApiClient): Promise<Account> {
  if (adminSession) {
    const client = apiClient.withToken(adminSession.token)
    if ((await client.me()).status === 200) return { client, ...adminSession }
  }

  const login = await apiClient.login({ email: SEEDED.accounts.admin, password: DEFAULT_PASSWORD })
  if (login.status !== 200) throw new Error(`Admin bejelentkezes sikertelen (${String(login.status)})`)

  adminSession = { token: login.body.data.token, user: login.body.data.user }
  return { client: apiClient.withToken(adminSession.token), ...adminSession }
}

/** Friss diak megerositett e-mail-cimmel, elofizetes nelkul (fizetos tartalomnal `subscription_required`). */
export async function verifiedStudent(apiClient: ApiClient, admin: ApiClient): Promise<Account> {
  const account = await apiClient.signUp(registration())

  const verified = await admin.adminVerifyEmail(account.user.id, 'Playwright API teszt')
  if (!verified.ok) throw new Error(`Az e-mail megerositese sikertelen (${String(verified.status)})`)

  return account
}

/**
 * Friss diak premium hozzaferessel: regisztracio, admin altali
 * e-mail-megerosites, kezi hozzaferes (access grant), majd a tokenes kliens.
 * A premiumhoz megerositett e-mail is kell (ContentAccess), ezert mindketto.
 *
 * @param admin Admin tokenes kliens (`adminAccount(apiClient).client`).
 */
export async function premiumStudent(apiClient: ApiClient, admin: ApiClient): Promise<Account> {
  const account = await verifiedStudent(apiClient, admin)

  const granted = await admin.post(`admin/users/${String(account.user.id)}/access-grants`, { reason: 'Playwright API teszt' })
  if (granted.status !== 201) throw new Error(`A premium hozzaferes kiadasa sikertelen (${String(granted.status)})`)

  return account
}
