import { randomUUID } from 'node:crypto'
import { adminAccount, verifiedStudent } from '../../src/api/areas/accounts'
import { accountExport, deleteAccount } from '../../src/api/areas/progress'
import { createInviteCode, withRegistrationMode } from '../../src/api/areas/registrationGate'
import {
  authProviders,
  consentRequiredOf,
  goThroughGoogle,
  googleCode,
  googleComplete,
  googleExchange,
  googleRedirect,
  pkce,
  signedInOf,
  signUpWithGoogle,
} from '../../src/api/areas/social'
import { Outbox } from '../../src/api/Outbox'
import { DEFAULT_PASSWORD, registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'
import { rowCount } from '../../src/support/artisan'

/**
 * Google-belépés (ADR 0004). A "Google" a src/mocks/google mockja: a teszt állítja be, ki lép be. A
 * böngészőben tartott titkot (verifier) és a hash-ét (challenge) a `pkce` állítja elő; az átirányításokat
 * a teszt kézzel követi, hogy a `Location` fejlécek vizsgálhatók legyenek.
 */

test.describe('Google-belépés: elérhetőség és engedélykérés', () => {
  test('a szerver jelzi, hogy a Google-belépés be van kapcsolva, bejelentkezés nélkül is', { tag: '@smoke' }, async ({ apiClient }) => {
    const result = await authProviders(apiClient)

    expect(result.status).toBe(200)
    expect(result.body.data.google).toBe(true)
  })

  const invalidChallenges: Record<string, string> = {
    'túl rövid': 'rovid',
    'túl hosszú (44 karakter)': 'a'.repeat(44),
    'tiltott karakter': `${'a'.repeat(42)}+`,
    üres: '',
  }
  for (const [label, challenge] of Object.entries(invalidChallenges)) {
    test(`érvénytelen code_challenge (${label}) 422`, { tag: '@regression' }, async ({ apiClient }) => {
      const result = await googleRedirect(apiClient, challenge)

      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty('code_challenge')
    })
  }

  test('az engedélykérés címe a Google-re mutat: kliens, hatókör, fiókválasztás, visszatérési cím és state', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await googleRedirect(apiClient, pkce().challenge)

    expect(result.status).toBe(200)
    const url = new URL(result.body.data.url)
    expect(url.searchParams.get('client_id')).toBe('pw-google-client')
    expect(url.searchParams.get('scope')).toContain('openid')
    expect(url.searchParams.get('scope')).toContain('email')
    expect(url.searchParams.get('prompt')).toBe('select_account')
    expect(url.searchParams.get('redirect_uri')).toMatch(/\/api\/v1\/auth\/google\/callback$/)
    expect(url.searchParams.get('state')?.length).toBeGreaterThanOrEqual(32)
  })

  test('minden engedélykéréshez más state tartozik', { tag: '@regression' }, async ({ apiClient }) => {
    const first = new URL((await googleRedirect(apiClient, pkce().challenge)).body.data.url)
    const second = new URL((await googleRedirect(apiClient, pkce().challenge)).body.data.url)

    expect(first.searchParams.get('state')).not.toBe(second.searchParams.get('state'))
  })
})

test.describe('Google-belépés: új fiók', () => {
  test('az új felhasználó hozzájárulás után kap fiókot: megerősített e-mail, jelszó nélkül, összekötve', { tag: '@smoke' }, async ({ apiClient, googleStub }) => {
    const identity = await googleStub.signInAs()
    const { code, pkce: pair } = await googleCode(apiClient)

    const exchanged = await googleExchange(apiClient, code, pair.verifier)
    expect(exchanged.status).toBe(200)
    expect(consentRequiredOf(exchanged.body.data)).toMatchObject({ name: identity.name, email: identity.email })

    const completed = await googleComplete(apiClient, code, pair.verifier)
    expect(completed.status).toBe(200)
    const { token, user } = completed.body.data
    expect(user.email).toBe(identity.email)
    expect(user.name).toBe(identity.name)
    expect(user.role).toBe('student')
    expect(user.email_verified_at).not.toBeNull()
    expect(user.has_password).toBe(false)
    expect(user.linked_providers).toEqual(['google'])

    const me = await apiClient.withToken(token).me()
    expect(me.status).toBe(200)
    expect(me.body.data.has_password).toBe(false)
  })

  test('a hozzájárulás (ÁSZF és adatkezelés) rögzül, és egy Google-összekötés jön létre', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    const account = await signUpWithGoogle(apiClient, googleStub)

    expect(rowCount('consents', account.user.id)).toBe(2)
    expect(rowCount('social_accounts', account.user.id)).toBe(1)
  })

  test('hozzájárulás nélkül nincs fiók, és a kód a megerősítésig érvényes marad', { tag: '@smoke' }, async ({ apiClient, googleStub }) => {
    const identity = await googleStub.signInAs()
    const { code, pkce: pair } = await googleCode(apiClient)

    const refused = await googleComplete(apiClient, code, pair.verifier, { accept_terms: false })

    expect(refused.status).toBe(422)
    expect(refused.errorBody.errors).toHaveProperty('accept_terms')
    const again = await googleExchange(apiClient, code, pair.verifier)
    expect(consentRequiredOf(again.body.data).email).toBe(identity.email)
    expect((await googleComplete(apiClient, code, pair.verifier)).status).toBe(200)
  })

  for (const missing of ['terms_version', 'privacy_version'] as const) {
    test(`hiányzó ${missing} 422`, { tag: '@regression' }, async ({ apiClient, googleStub }) => {
      await googleStub.signInAs()
      const { code, pkce: pair } = await googleCode(apiClient)

      const result = await googleComplete(apiClient, code, pair.verifier, { [missing]: undefined })

      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty(missing)
    })
  }

  test('a visszatérő Google-felhasználó hozzájárulás nélkül, azonnal belép ugyanabba a fiókba', { tag: '@smoke' }, async ({ apiClient, googleStub }) => {
    const account = await signUpWithGoogle(apiClient, googleStub)
    await googleStub.signInAs({ sub: account.identity.sub, email: account.identity.email })

    const { code, pkce: pair } = await googleCode(apiClient)
    const exchanged = await googleExchange(apiClient, code, pair.verifier)

    expect(exchanged.status).toBe(200)
    const session = signedInOf(exchanged.body.data)
    expect(session.user.id).toBe(account.user.id)
    expect(session.token).not.toBe(account.token)
  })

  test('a kód egyszer használható: belépés után a második váltás 422', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    const account = await signUpWithGoogle(apiClient, googleStub)
    await googleStub.signInAs({ sub: account.identity.sub, email: account.identity.email })
    const { code, pkce: pair } = await googleCode(apiClient)
    expect((await googleExchange(apiClient, code, pair.verifier)).status).toBe(200)

    const replay = await googleExchange(apiClient, code, pair.verifier)

    expect(replay.status).toBe(422)
    expect(replay.errorBody.message).toBeTruthy()
  })

  test('hibás verifier 422, és a kódot nem fogyasztja el: a jó verifier utána még működik', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    await googleStub.signInAs()
    const { code, pkce: pair } = await googleCode(apiClient)

    const wrong = await googleExchange(apiClient, code, pkce().verifier)

    expect(wrong.status).toBe(422)
    expect((await googleComplete(apiClient, code, pkce().verifier)).status).toBe(422)
    expect((await googleExchange(apiClient, code, pair.verifier)).status).toBe(200)
  })

  test('ismeretlen kód 422', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await googleExchange(apiClient, 'nincs-ilyen-kod', pkce().verifier)

    expect(result.status).toBe(422)
  })

  const invalidVerifiers: Record<string, string> = {
    'túl rövid': 'rovid',
    'túl hosszú (129 karakter)': 'a'.repeat(129),
    'tiltott karakter': `${'a'.repeat(20)}!${'a'.repeat(22)}`,
  }
  for (const [label, verifier] of Object.entries(invalidVerifiers)) {
    test(`érvénytelen alakú verifier (${label}) 422`, { tag: '@regression' }, async ({ apiClient }) => {
      const result = await googleExchange(apiClient, 'bármi', verifier)

      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty('code_verifier')
    })
  }

  test('a Google által nem igazolt e-mail-címmel nincs belépés és nincs fiók', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    await googleStub.signInAs({ email_verified: false })
    const { code, pkce: pair } = await googleCode(apiClient)

    const exchanged = await googleExchange(apiClient, code, pair.verifier)

    expect(exchanged.status).toBe(422)
    expect(exchanged.errorBody.message).toContain('nincs megerősítve')
    expect((await googleComplete(apiClient, code, pair.verifier)).status).toBe(422)
  })

  test('az új fiók neve a Google-fiók neve, a hosszú név 255 karakterre vágva', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    const account = await signUpWithGoogle(apiClient, googleStub, { name: 'N'.repeat(300) })

    expect(account.user.name).toHaveLength(255)
  })
})

test.describe('Google-belépés: meglévő fiókkal való összekötés', () => {
  test('a megerősített e-mail-című fiókba belép, a jelszava megmarad, és a tulajdonos értesítést kap', { tag: '@smoke' }, async ({ apiClient, googleStub, outbox }) => {
    const admin = (await adminAccount(apiClient)).client
    const student = await verifiedStudent(apiClient, admin)
    await googleStub.signInAs({ email: student.user.email })
    const { code, pkce: pair } = await googleCode(apiClient)

    const exchanged = await googleExchange(apiClient, code, pair.verifier)

    expect(exchanged.status).toBe(200)
    const session = signedInOf(exchanged.body.data)
    expect(session.user.id).toBe(student.user.id)
    expect(session.user.has_password).toBe(true)
    expect(session.user.linked_providers).toEqual(['google'])
    expect((await apiClient.login({ email: student.user.email, password: DEFAULT_PASSWORD })).status).toBe(200)
    await expect.poll(async () => (await outbox.latestTo(student.user.email)).subject).toContain('Összekötöttük')
  })

  test('a Google e-mail-címe kis- és nagybetűtől függetlenül ugyanaz a fiók', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    const admin = (await adminAccount(apiClient)).client
    const student = await verifiedStudent(apiClient, admin)
    await googleStub.signInAs({ email: student.user.email.toUpperCase() })
    const { code, pkce: pair } = await googleCode(apiClient)

    const exchanged = await googleExchange(apiClient, code, pair.verifier)

    expect(signedInOf(exchanged.body.data).user.id).toBe(student.user.id)
  })

  test('előzetes regisztráció (pre-hijack): a nem megerősített fiókba belépve a támadó jelszava és tokenje megszűnik', { tag: '@smoke' }, async ({ apiClient, googleStub }) => {
    const attacker = registration()
    const planted = await apiClient.signUp(attacker)
    expect((await planted.client.me()).status).toBe(200)
    await googleStub.signInAs({ email: attacker.email })
    const { code, pkce: pair } = await googleCode(apiClient)

    const exchanged = await googleExchange(apiClient, code, pair.verifier)

    expect(exchanged.status).toBe(200)
    const session = signedInOf(exchanged.body.data)
    expect(session.user.id).toBe(planted.user.id)
    expect(session.user.email_verified_at).not.toBeNull()
    expect(session.user.has_password).toBe(false)
    expect((await planted.client.me()).status, 'a támadó korábbi tokenje').toBe(401)
    expect((await apiClient.login({ email: attacker.email, password: attacker.password })).status, 'a támadó jelszava').toBe(401)
  })
})

test.describe('Google-belépés: a visszatérés a frontendre', () => {
  test('ismeretlen state: a frontend hibaoldalára irányít, nem nyers JSON-t ad', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await apiClient.getWithoutRedirect('auth/google/callback?state=nincs&code=x')

    expect(result.status).toBe(302)
    expect(result.location).toMatch(/\/belepes\/google\?error=failed$/)
  })

  test('hiányzó state ugyanígy a hibaoldalra visz', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await apiClient.getWithoutRedirect('auth/google/callback?code=x')

    expect(result.status).toBe(302)
    expect(result.location).toMatch(/\/belepes\/google\?error=failed$/)
  })

  test('a megszakított engedélykérés (Mégsem) a „megszakítva” hibakódra vezet, kód nélkül', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    await googleStub.denyNext()

    const returned = await goThroughGoogle(apiClient)

    expect(returned.error).toBe('cancelled')
    expect(returned.code).toBeNull()
    expect(returned.landing.pathname).toBe('/belepes/google')
  })

  test('a sikeres visszatérés a frontend /belepes/google oldalára viszi a kódot', { tag: '@smoke' }, async ({ apiClient, googleStub }) => {
    await googleStub.signInAs()

    const returned = await goThroughGoogle(apiClient)

    expect(returned.landing.pathname).toBe('/belepes/google')
    expect(returned.error).toBeNull()
    expect(returned.code?.length).toBeGreaterThanOrEqual(32)
  })

  test('a state egyszer használható: a visszatérés újrajátszása hibára fut', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    await googleStub.signInAs()
    const redirect = await googleRedirect(apiClient, pkce().challenge)
    const toGoogle = await apiClient.getWithoutRedirect(redirect.body.data.url)
    const callbackUrl = toGoogle.location ?? ''

    const first = await apiClient.getWithoutRedirect(callbackUrl)
    const replay = await apiClient.getWithoutRedirect(callbackUrl)

    expect(new URL(first.location ?? '').searchParams.get('code')).toBeTruthy()
    expect(replay.location).toMatch(/\/belepes\/google\?error=failed$/)
  })
})

test.describe('Google-belépés: jelszó nélküli fiók', () => {
  test('jelszavas belépés nem lehetséges (401, nem 500)', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    const account = await signUpWithGoogle(apiClient, googleStub)

    const result = await apiClient.login({ email: account.user.email, password: DEFAULT_PASSWORD })

    expect(result.status).toBe(401)
  })

  test('a jelszót kérő műveletek érthető hibát adnak: jelszócsere, e-mail-csere és fióktörlés', { tag: '@regression' }, async ({ apiClient, googleStub, request }) => {
    const account = await signUpWithGoogle(apiClient, googleStub)

    const change = await account.client.put<{ message: string }>('account/password', {
      current_password: 'bármi',
      password: 'Uj12345678',
      password_confirmation: 'Uj12345678',
    })
    const email = await account.client.post<{ message: string }>('account/email', { email: 'masik@example.test', current_password: 'bármi' })

    expect(change.status).toBe(422)
    expect(change.body.message).toContain('jelszó kell')
    expect(email.status).toBe(422)
    expect(email.body.message).toContain('jelszó kell')
    expect(await deleteAccount(request, account.token, 'bármi')).toBe(422)
    expect((await account.client.me()).status, 'a fiók megmaradt').toBe(200)
  })

  test('az „elfelejtett jelszó” levélen át jelszót állíthat be, utána jelszóval is beléphet', { tag: '@smoke' }, async ({ apiClient, googleStub, outbox }) => {
    const account = await signUpWithGoogle(apiClient, googleStub)

    const forgot = await apiClient.post('auth/forgot-password', { email: account.user.email })
    expect(forgot.status).toBeLessThan(300)
    const link = Outbox.linkTo(await outbox.latestTo(account.user.email), '/jelszo-visszaallitas')
    const reset = await apiClient.post('auth/reset-password', {
      token: link.searchParams.get('token'),
      email: account.user.email,
      password: 'Uj12345678',
      password_confirmation: 'Uj12345678',
    })

    expect(reset.status).toBeLessThan(300)
    const login = await apiClient.login({ email: account.user.email, password: 'Uj12345678' })
    expect(login.status).toBe(200)
    expect(login.body.data.user.has_password).toBe(true)
    expect(login.body.data.user.linked_providers).toEqual(['google'])
  })
})

test.describe('Google-belépés: zárt béta', () => {
  test('meghívókód nélkül Google-lel sem nyílik fiók; érvényes kóddal igen', { tag: '@smoke' }, async ({ apiClient, googleStub }) => {
    const admin = (await adminAccount(apiClient)).client
    await googleStub.signInAs()
    const { code, pkce: pair } = await googleCode(apiClient)

    await withRegistrationMode(admin, 'invite', async () => {
      const missing = await googleComplete(apiClient, code, pair.verifier)
      expect(missing.status).toBe(422)
      expect(missing.errorBody.errors).toHaveProperty('invite_code')

      const invalid = await googleComplete(apiClient, code, pair.verifier, { invite_code: 'ROSSZ-KOD' })
      expect(invalid.status).toBe(422)
      expect(invalid.errorBody.errors).toHaveProperty('invite_code')

      const invite = await createInviteCode(admin, { label: 'Playwright Google', max_uses: 1 })
      const accepted = await googleComplete(apiClient, code, pair.verifier, { invite_code: invite.code })
      expect(accepted.status).toBe(200)
    })
  })

  test('zárt módban a már összekötött felhasználó meghívókód nélkül is belép', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    const admin = (await adminAccount(apiClient)).client
    const account = await signUpWithGoogle(apiClient, googleStub)
    await googleStub.signInAs({ sub: account.identity.sub, email: account.identity.email })

    await withRegistrationMode(admin, 'invite', async () => {
      const { code, pkce: pair } = await googleCode(apiClient)
      const exchanged = await googleExchange(apiClient, code, pair.verifier)

      expect(signedInOf(exchanged.body.data).user.id).toBe(account.user.id)
    })
  })
})

test.describe('Google-belépés: adatvédelem', () => {
  test('az adatexport csak a szolgáltató nevét és a kötés idejét tartalmazza: token és azonosító nem szerepel', { tag: '@regression' }, async ({ apiClient, googleStub }) => {
    const account = await signUpWithGoogle(apiClient, googleStub, { sub: `sub-${randomUUID()}` })

    const exported = await accountExport(account.client)

    expect(exported.status).toBe(200)
    expect(exported.body.linked_logins).toEqual([{ provider: 'google', linked_at: expect.any(String) }])
    const text = JSON.stringify(exported.body)
    expect(text).not.toContain('pw-google-access-token')
    expect(text).not.toContain(account.identity.sub)
  })

  test('a fiók törlése megszünteti a Google-kötést: ugyanaz a Google-fiók utána új fiókként kezelődik', { tag: '@regression' }, async ({ apiClient, googleStub, request }) => {
    const admin = (await adminAccount(apiClient)).client
    const student = await verifiedStudent(apiClient, admin)
    await googleStub.signInAs({ email: student.user.email })
    const { code, pkce: pair } = await googleCode(apiClient)
    expect((await googleExchange(apiClient, code, pair.verifier)).status).toBe(200)
    expect(rowCount('social_accounts', student.user.id)).toBe(1)

    expect(await deleteAccount(request, student.token, DEFAULT_PASSWORD)).toBe(204)

    expect(rowCount('social_accounts', student.user.id)).toBe(0)
    const next = await googleCode(apiClient)
    const exchanged = await googleExchange(apiClient, next.code, next.pkce.verifier)
    expect(consentRequiredOf(exchanged.body.data).email).toBe(student.user.email)
  })
})
