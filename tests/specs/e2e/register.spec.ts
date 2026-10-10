import { registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'

test.describe('Regisztráció', () => {
  test('az elfogadás a dokumentumok verziójával együtt megy a szervernek', { tag: '@smoke' }, async ({ mockApi, registerPage, page }) => {
    const payload = registration()
    const sent = await mockApi.onRegister({ id: 7, name: payload.name, email: payload.email, role: 'student', email_verified_at: null })
    await registerPage.goto()

    await registerPage.fillForm(payload)
    await registerPage.acceptTerms.check()
    await registerPage.submit()

    await expect(page).toHaveURL(/\/regisztracio\/kesz$/)
    expect(sent()).toMatchObject({
      email: payload.email,
      accept_terms: true,
      terms_version: expect.stringMatching(/^\d+\.\d+$/),
      privacy_version: expect.stringMatching(/^\d+\.\d+$/),
    })
  })

  test('elfogadás nélkül nem megy el a kérés, és a hiba megmondja, mi hiányzik', { tag: '@regression' }, async ({ mockApi, registerPage }) => {
    const payload = registration()
    const sent = await mockApi.onRegister({ id: 7, name: payload.name, email: payload.email, role: 'student', email_verified_at: null })
    await registerPage.goto()

    await registerPage.fillForm(payload)
    await registerPage.submit()

    await expect(registerPage.termsError).toBeVisible()
    expect(sent()).toBeUndefined()
  })

  test('a feltételek új lapon nyílnak, hogy a kitöltött űrlap megmaradjon', { tag: '@regression' }, async ({ registerPage }) => {
    await registerPage.goto()

    await expect(registerPage.termsLink).toHaveAttribute('target', '_blank')
    await expect(registerPage.termsLink).toHaveAttribute('href', '/aszf')
  })
})
