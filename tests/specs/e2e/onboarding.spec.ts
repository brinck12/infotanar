import { expect, test } from '../../src/fixtures'

const USER = { id: 7, name: 'Teszt Elek', email: 'teszt@example.test', role: 'student' as const, email_verified_at: '2026-01-01T00:00:00+00:00' }
const SERVER_GOALS = { level: 'emelt', exam_period: '2027-10', language: 'csharp', weekly_hours: '5+' }
const BROWSER_GOALS = { level: 'emelt', examPeriod: '2028-05', language: 'python', weeklyHours: '1-2' }

test.describe('Tanulási célok', () => {
  test('belépve a szerver mentett céljai töltődnek be', { tag: '@regression' }, async ({ mockApi, onboardingPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withPreferences(SERVER_GOALS)
    await onboardingPage.goto()

    await expect(onboardingPage.emelt).toBeChecked()
    await expect(onboardingPage.csharp).toBeChecked()
    await expect(onboardingPage.period).toHaveValue('2027-10')
    await expect(onboardingPage.serverStorageNote).toBeVisible()
  })

  test('a mentés a vezetékes kulcsokkal megy a szervernek', { tag: '@regression' }, async ({ mockApi, onboardingPage, page }) => {
    await mockApi.signIn(USER)
    const sent = await mockApi.withPreferences(SERVER_GOALS)
    await onboardingPage.goto()

    await onboardingPage.kozep.check()
    await onboardingPage.submit()

    await expect(page).toHaveURL(/\/tanulasi-ut$/)
    expect(sent()).toEqual({ ...SERVER_GOALS, level: 'kozep' })
  })

  test('a böngészőben régebben mentett célok egyszer átkerülnek a szerverre', { tag: '@regression' }, async ({ mockApi, onboardingPage, page }) => {
    await page.addInitScript((goals) => { localStorage.setItem('infotanar.preferences.v1.u7', JSON.stringify(goals)); }, BROWSER_GOALS)
    await mockApi.signIn(USER)
    const sent = await mockApi.withPreferences(null)
    await onboardingPage.goto()

    await expect.poll(sent).toEqual({ level: 'emelt', exam_period: '2028-05', language: 'python', weekly_hours: '1-2' })
    await expect.poll(() => page.evaluate(() => localStorage.getItem('infotanar.preferences.v1.u7'))).toBeNull()
  })

  test('a végpont nélkül a böngésző őrzi a célokat, hibaüzenet nélkül', { tag: '@regression' }, async ({ mockApi, onboardingPage, page }) => {
    await mockApi.signIn(USER)
    await mockApi.withPreferences('missing')
    await onboardingPage.goto()

    await expect(onboardingPage.browserStorageNote).toBeVisible()
    await onboardingPage.emelt.check()
    await onboardingPage.submit()

    await expect(page).toHaveURL(/\/tanulasi-ut$/)
    await expect(onboardingPage.saveError).toHaveCount(0)
    const stored = await page.evaluate(() => localStorage.getItem('infotanar.preferences.v1.u7'))
    expect(stored).toContain('"level":"emelt"')
  })

  test('vendégnél a böngésző őrzi a célokat', { tag: '@regression' }, async ({ onboardingPage, page }) => {
    await onboardingPage.goto()
    await onboardingPage.emelt.check()
    await onboardingPage.submit()

    await expect(page).toHaveURL(/\/tanulasi-ut$/)
    const stored = await page.evaluate(() => localStorage.getItem('infotanar.preferences.v1.guest'))
    expect(stored).toContain('"level":"emelt"')
  })

  test('ha a szerver nem válaszol, hibát látsz az alapértékek helyett, és nem mentesz', { tag: '@regression' }, async ({ mockApi, onboardingPage }) => {
    await mockApi.signIn(USER)
    const sent = await mockApi.withPreferences('error')

    await onboardingPage.goto()

    await expect(onboardingPage.loadError).toBeVisible()
    await expect(onboardingPage.submitButton).toHaveCount(0)
    expect(sent()).toBeUndefined()
  })
})
