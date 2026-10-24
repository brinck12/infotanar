import { createHash } from 'node:crypto'
import { buildStudent } from '../../src/data'
import { expect, test } from '../../src/fixtures'

/**
 * Google-belépés a böngészőben (mockolt API). A Google-oldalra átirányítás helyett a mock azonnal a
 * frontend visszatérési oldalára (`/belepes/google?code=…`) visz: a teszt a gombot, a PKCE-titok kezelését,
 * a hozzájárulás-képernyőt és a hibaoldalakat nézi. A teljes kört (valódi backend) az API-teszt fedi.
 */

const STUDENT = buildStudent()
const GOOGLE_PROFILE = { name: 'Google Gabi', email: 'gabi@example.test' }

test.describe('Google-gomb', () => {
  test('a belépő és a regisztrációs oldalon is ott van, ha a szerver kínálja', { tag: '@smoke' }, async ({ mockApi, loginPage, registerPage }) => {
    await mockApi.withAuthProviders(true)

    await loginPage.goto()
    await expect(loginPage.googleButton).toBeVisible()
    await registerPage.goto()
    await expect(loginPage.googleButton).toBeVisible()
  })

  test('kikapcsolt Google-belépésnél (vagy ha a lekérdezés hibás) nincs gomb, az e-mailes belépés teljes értékű', { tag: '@regression' }, async ({ mockApi, loginPage }) => {
    await mockApi.withAuthProviders(false)

    await loginPage.goto()

    await expect(loginPage.submitButton).toBeVisible()
    await expect(loginPage.googleButton).toHaveCount(0)
  })

  test('a szerver hibája esetén sincs gomb, és nincs hibaüzenet sem', { tag: '@regression' }, async ({ loginPage, page }) => {
    await page.route('**/api/v1/auth/providers', (route) => route.fulfill({ status: 500, json: { message: 'Hiba' } }))

    await loginPage.goto()

    await expect(loginPage.submitButton).toBeVisible()
    await expect(loginPage.googleButton).toHaveCount(0)
    await expect(loginPage.googleError).toHaveCount(0)
  })
})

test.describe('Google-belépés: meglévő fiók', () => {
  test('a gomb a titok hash-ét küldi el, a kódváltás ugyanazt a titkot: egyetlen kör után be van lépve', { tag: '@smoke' }, async ({ mockApi, loginPage, page }) => {
    const google = await mockApi.withGoogleLogin({ exchange: 'signed_in', user: STUDENT })
    await loginPage.goto()

    await loginPage.continueWithGoogle()

    await expect(page).toHaveURL(/\/feladatok$/)
    const [redirect] = google.redirects()
    const [exchange] = google.exchanges()
    const challenge = String(redirect?.code_challenge)
    const verifier = String(exchange?.code_verifier)
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(createHash('sha256').update(verifier).digest('base64url'), 'a hash a titokból számolható').toBe(challenge)
    expect(exchange).toMatchObject({ code: 'pw-mock-code', device_name: 'web' })
    expect(await page.evaluate(() => localStorage.getItem('infotanar.token'))).toBe('pw-mock-token')
  })

  test('belépés után a titok törlődik a böngésző tárhelyéről', { tag: '@regression' }, async ({ mockApi, loginPage, page }) => {
    await mockApi.withGoogleLogin({ exchange: 'signed_in', user: STUDENT })
    await loginPage.goto()

    await loginPage.continueWithGoogle()

    await expect(page).toHaveURL(/\/feladatok$/)
    expect(await page.evaluate(() => sessionStorage.getItem('infotanar.google.login'))).toBeNull()
  })

  test('védett oldalról érkezve belépés után oda tér vissza, ahonnan elindult', { tag: '@regression' }, async ({ mockApi, loginPage, page }) => {
    await mockApi.withGoogleLogin({ exchange: 'signed_in', user: STUDENT })
    await page.route('**/api/v1/progress', (route) => route.fulfill({ json: { data: { overall: { completed: 0, total: 0, percent: 0 }, tracks: [] } } }))
    await loginPage.goto('/haladas')
    await expect(page).toHaveURL(/\/bejelentkezes$/)

    await loginPage.continueWithGoogle()

    await expect(page).toHaveURL(/\/haladas$/)
  })

  test('a szerver elutasítása érthető üzenet, nem összeomlás, és vissza lehet lépni a belépéshez', { tag: '@regression' }, async ({ mockApi, loginPage, page }) => {
    await mockApi.withGoogleLogin({ exchange: 'rejected', user: STUDENT })
    await loginPage.goto()

    await loginPage.continueWithGoogle()

    await expect(page.getByRole('heading', { name: 'Nem sikerült belépni' })).toBeVisible()
    await expect(page.getByText('A Google-belépés nem sikerült. Próbáld újra, vagy lépj be e-mail-címmel.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Vissza a belépéshez' })).toHaveAttribute('href', '/bejelentkezes')
  })
})

test.describe('Google-belépés: új fiók (hozzájárulás)', () => {
  test('az új felhasználó előbb látja, mivel nyílik fiók, és elfogadás nélkül a szerver hibája látszik', { tag: '@smoke' }, async ({ mockApi, loginPage, page }) => {
    const google = await mockApi.withGoogleLogin({ exchange: 'consent_required', user: STUDENT, profile: GOOGLE_PROFILE })
    await loginPage.goto()

    await loginPage.continueWithGoogle()

    await expect(page.getByRole('heading', { name: 'Fiók létrehozása' })).toBeVisible()
    await expect(page.getByText(GOOGLE_PROFILE.email)).toBeVisible()
    await page.getByRole('button', { name: 'Fiók létrehozása' }).click()
    await expect(page.getByText('A regisztrációhoz el kell fogadnod az ÁSZF-et.')).toBeVisible()
    expect(google.completes()[0]).toMatchObject({ accept_terms: false })
    await expect(page).toHaveURL(/\/belepes\/google/)
  })

  test('az elfogadás a dokumentumok verziójával és ugyanazzal a titokkal megy, utána be van lépve', { tag: '@smoke' }, async ({ mockApi, loginPage, page }) => {
    const google = await mockApi.withGoogleLogin({ exchange: 'consent_required', user: STUDENT, profile: GOOGLE_PROFILE })
    await loginPage.goto()
    await loginPage.continueWithGoogle()

    await page.getByRole('checkbox', { name: /Elfogadom/ }).check()
    await page.getByRole('button', { name: 'Fiók létrehozása' }).click()

    await expect(page).toHaveURL(/\/feladatok$/)
    const [exchange] = google.exchanges()
    expect(google.completes()[0]).toMatchObject({
      code: 'pw-mock-code',
      code_verifier: exchange?.code_verifier,
      accept_terms: true,
      terms_version: expect.stringMatching(/^\d+\.\d+$/),
      privacy_version: expect.stringMatching(/^\d+\.\d+$/),
    })
    expect(await page.evaluate(() => localStorage.getItem('infotanar.token'))).toBe('pw-mock-token')
  })

  test('zárt béta alatt meghívókódot is kér, és azt elküldi', { tag: '@regression' }, async ({ mockApi, loginPage, page }) => {
    await mockApi.withRegistrationMode('invite')
    const google = await mockApi.withGoogleLogin({ exchange: 'consent_required', user: STUDENT, profile: GOOGLE_PROFILE })
    await loginPage.goto()
    await loginPage.continueWithGoogle()

    await page.getByLabel('Meghívókód').fill('PW-BETA-1')
    await page.getByRole('checkbox', { name: /Elfogadom/ }).check()
    await page.getByRole('button', { name: 'Fiók létrehozása' }).click()

    await expect(page).toHaveURL(/\/feladatok$/)
    expect(google.completes()[0]).toMatchObject({ invite_code: 'PW-BETA-1' })
  })

  test('nyitott regisztrációnál nincs meghívókód-mező, és nem is megy el a kérésben', { tag: '@regression' }, async ({ mockApi, loginPage, page }) => {
    const google = await mockApi.withGoogleLogin({ exchange: 'consent_required', user: STUDENT, profile: GOOGLE_PROFILE })
    await loginPage.goto()
    await loginPage.continueWithGoogle()

    await expect(page.getByRole('heading', { name: 'Fiók létrehozása' })).toBeVisible()
    await expect(page.getByLabel('Meghívókód')).toHaveCount(0)
    await page.getByRole('checkbox', { name: /Elfogadom/ }).check()
    await page.getByRole('button', { name: 'Fiók létrehozása' }).click()

    await expect(page).toHaveURL(/\/feladatok$/)
    expect(google.completes()[0]).not.toHaveProperty('invite_code')
  })
})

test.describe('Google-belépés: hibás visszatérés', () => {
  test('a megszakított belépés érthető üzenet, link a belépéshez, nem nyers hiba', { tag: '@regression' }, async ({ loginPage, page }) => {
    await loginPage.goto('/belepes/google?error=cancelled')

    await expect(page.getByRole('heading', { name: 'Nem sikerült belépni' })).toBeVisible()
    await expect(page.getByText('A Google-belépést megszakítottad.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Vissza a belépéshez' })).toHaveAttribute('href', '/bejelentkezes')
  })

  test('az ismeretlen vagy a „sikertelen” hibakód általános, de érthető üzenetet ad', { tag: '@regression' }, async ({ loginPage, page }) => {
    await loginPage.goto('/belepes/google?error=failed')

    await expect(page.getByText('A Google-belépés nem sikerült. Próbáld újra, vagy lépj be e-mail-címmel.')).toBeVisible()
  })

  test('kód a böngészőben tartott titok nélkül (másik böngészőből vagy lejárt folyamat) „kezdd újra” üzenet, kérés nélkül', { tag: '@regression' }, async ({ mockApi, loginPage, page }) => {
    const google = await mockApi.withGoogleLogin({ exchange: 'signed_in', user: STUDENT })

    await loginPage.goto('/belepes/google?code=masik-bongeszobol')

    await expect(page.getByText('A belépés lejárt, mert megszakadt a folyamat. Kezdd újra.')).toBeVisible()
    expect(google.exchanges(), 'titok nélkül nem váltunk kódot').toHaveLength(0)
  })

  test('kód és hibakód nélkül a belépőlap hibaüzenete látszik', { tag: '@regression' }, async ({ loginPage, page }) => {
    await loginPage.goto('/belepes/google')

    await expect(page.getByRole('heading', { name: 'Nem sikerült belépni' })).toBeVisible()
  })

  test('ha a böngésző nem engedi a tárolást, érthető üzenet jelenik meg, és el sem indul a kör', { tag: '@regression' }, async ({ mockApi, loginPage, page }) => {
    const google = await mockApi.withGoogleLogin({ exchange: 'signed_in', user: STUDENT })
    await page.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
      })
    })
    await loginPage.goto()

    await loginPage.continueWithGoogle()

    await expect(loginPage.googleError).toContainText('nem engedi a Google-belépéshez szükséges tárolást')
    expect(google.redirects()).toHaveLength(0)
    await expect(page).toHaveURL(/\/bejelentkezes$/)
  })
})

test.describe('Fiókoldal Google-lel nyitott (jelszó nélküli) fióknál', () => {
  const GOOGLE_USER = buildStudent({ has_password: false, linked_providers: ['google'] })

  test('jelzi az összekötést, a jelszót kérő részek helyett magyarázatot ad, és nincs jelszómező vagy törlés gomb', { tag: '@smoke' }, async ({ mockApi, accountPage }) => {
    await mockApi.signIn(GOOGLE_USER)

    await accountPage.goto()

    await expect(accountPage.googleLinkedNote).toBeVisible()
    await expect(accountPage.setPasswordButton).toBeVisible()
    await expect(accountPage.passwordFirstNotes).toHaveCount(2)
    await expect(accountPage.changePasswordButton).toHaveCount(0)
    await expect(accountPage.deleteAccountButton).toHaveCount(0)
  })

  test('a „Jelszó beállítása e-mailben” gomb az elfelejtett jelszó levelet kéri a saját címre', { tag: '@smoke' }, async ({ mockApi, accountPage }) => {
    await mockApi.signIn(GOOGLE_USER)
    const sent = await mockApi.onForgotPassword()
    await accountPage.goto()

    await accountPage.setPasswordButton.click()

    await expect(accountPage.setPasswordSent).toBeVisible()
    expect(sent()).toEqual([{ email: GOOGLE_USER.email }])
  })

  test('a jelszóval rendelkező fióknál minden a megszokott: jelszócsere és törlés van, Google-jelzés nincs', { tag: '@regression' }, async ({ mockApi, accountPage }) => {
    await mockApi.signIn(STUDENT)

    await accountPage.goto()

    await expect(accountPage.changePasswordButton).toBeVisible()
    await expect(accountPage.deleteAccountButton).toBeVisible()
    await expect(accountPage.setPasswordButton).toHaveCount(0)
    await expect(accountPage.googleLinkedNote).toHaveCount(0)
  })

  test('a régebbi (a mezőket nem ismerő) válasz jelszavas fiókként viselkedik, nem omlik össze', { tag: '@regression' }, async ({ mockApi, accountPage }) => {
    await mockApi.signIn({ id: 7, name: 'Teszt Elek', email: 'teszt@example.test', role: 'student', email_verified_at: '2026-01-01T00:00:00+00:00' })

    await accountPage.goto()

    await expect(accountPage.changePasswordButton).toBeVisible()
    await expect(accountPage.setPasswordButton).toHaveCount(0)
  })
})
