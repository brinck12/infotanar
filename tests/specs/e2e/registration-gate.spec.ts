import { registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const ADMIN = { id: 1, name: 'Admin Anna', email: 'admin@example.test', role: 'admin' as const, email_verified_at: '2026-01-01T00:00:00+00:00' }

test.describe('Zárt béta: regisztrációs űrlap', () => {
  test('nyitott módban nincs meghívókód-mező és várólista', { tag: '@regression' }, async ({ registerPage }) => {
    await registerPage.goto()

    await expect(registerPage.name).toBeVisible()
    await expect(registerPage.inviteCode).toHaveCount(0)
    await expect(registerPage.waitlistEmail).toHaveCount(0)
  })

  test('meghívós módban a ?kod= előtölti a mezőt, és a kód a kéréssel együtt megy', { tag: '@smoke' }, async ({ mockApi, registerPage, page }) => {
    await mockApi.withRegistrationMode('invite')
    const payload = registration()
    const sent = await mockApi.onRegister({ id: 7, name: payload.name, email: payload.email, role: 'student', email_verified_at: null })
    await registerPage.goto('?kod=ABCD-2345')

    await expect(registerPage.inviteCode).toHaveValue('ABCD-2345')
    // Van kód: a várólista nem terel el.
    await expect(registerPage.waitlistEmail).toHaveCount(0)

    await registerPage.fillForm(payload)
    await registerPage.acceptTerms.check()
    await registerPage.submit()

    await expect(page).toHaveURL(/\/regisztracio\/kesz$/)
    expect(sent()).toMatchObject({ invite_code: 'ABCD-2345', accept_terms: true })
  })

  test('érvénytelen kód hibája a mező alatt jelenik meg, a többi hibával együtt', { tag: '@regression' }, async ({ mockApi, registerPage, page }) => {
    await mockApi.withRegistrationMode('invite')
    await mockApi.onRegisterRejected({
      invite_code: ['Ez a meghívókód nem érvényes, lejárt, vagy már elfogyott.'],
      password: ['A jelszónak legalább 8 karakteresnek kell lennie.'],
    })
    await registerPage.goto('?kod=ROSSZ')

    await registerPage.fillForm(registration({ password: 'rovid1', password_confirmation: 'rovid1' }))
    await registerPage.submit()

    await expect(page.getByText('Ez a meghívókód nem érvényes, lejárt, vagy már elfogyott.')).toBeVisible()
    await expect(page.getByText('A jelszónak legalább 8 karakteresnek kell lennie.')).toBeVisible()
  })

  test('kód nélkül a várólista-űrlap jelenik meg, és feliratkozás után visszajelzést ad', { tag: '@smoke' }, async ({ mockApi, registerPage }) => {
    await mockApi.withRegistrationMode('invite')
    const joined = await mockApi.onWaitlist()
    await registerPage.goto()

    await registerPage.waitlistEmail.fill('diak@example.test')
    await registerPage.waitlistSubmit.click()

    await expect(registerPage.waitlistDone).toBeVisible()
    expect(joined()).toEqual([{ email: 'diak@example.test' }])
  })

  test('a várólista hibája (túl sok kérés) érthetően megjelenik', { tag: '@regression' }, async ({ mockApi, registerPage, page }) => {
    await mockApi.withRegistrationMode('invite')
    await mockApi.onWaitlist({ status: 429 })
    await registerPage.goto()

    await registerPage.waitlistEmail.fill('diak@example.test')
    await registerPage.waitlistSubmit.click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(registerPage.waitlistDone).toHaveCount(0)
  })
})

test.describe('Zárt béta: admin meghívókódok', () => {
  test('a lista, a létrehozás kérése és a letiltás', { tag: '@regression' }, async ({ mockApi, page }) => {
    await mockApi.signIn(ADMIN)
    let created: unknown
    let disabledId: string | undefined
    const code = {
      id: 1,
      code: 'ABCD-2345',
      label: '12.A',
      max_uses: 30,
      uses: 4,
      state: 'active',
      expires_at: null,
      disabled_at: null,
      created_at: '2026-10-14T08:00:00+00:00',
    }
    await page.route('**/api/v1/admin/registration', (route) => route.fulfill({ json: { data: { mode: 'invite' } } }))
    await page.route('**/api/v1/admin/waitlist*', (route) =>
      route.fulfill({
        json: { data: [{ id: 1, email: 'varo@example.test', note: null, created_at: '2026-10-13T08:00:00+00:00' }], current_page: 1, last_page: 1, total: 1 },
      })
    )
    await page.route('**/api/v1/admin/invite-codes/*/disable', async (route) => {
      disabledId = new URL(route.request().url()).pathname.split('/').slice(-2)[0]
      code.state = 'disabled'
      await route.fulfill({ json: { data: code } })
    })
    await page.route('**/api/v1/admin/invite-codes*', async (route) => {
      if (route.request().method() === 'POST') {
        created = route.request().postDataJSON() as unknown
        await route.fulfill({ status: 201, json: { data: { ...code, id: 2, code: 'ZZZZ-9999', label: '10.B' } } })
        return
      }
      await route.fulfill({ json: { data: [code], current_page: 1, last_page: 1, total: 1 } })
    })

    await page.goto('/admin/meghivokodok')

    await expect(page.getByTestId('invite-code')).toHaveText('ABCD-2345')
    await expect(page.getByRole('switch', { name: /Zárt béta/ })).toBeChecked()
    await expect(page.getByText('varo@example.test')).toBeVisible()
    await expect(page.getByTestId('waitlist-total')).toHaveText('1 feliratkozó')

    await page.getByLabel('Megnevezés (pl. az osztály)').fill('10.B')
    await page.getByLabel('Hányan használhatják').fill('25')
    await page.getByRole('button', { name: 'Kód létrehozása' }).click()
    await expect.poll(() => created).toMatchObject({ label: '10.B', max_uses: 25, expires_at: null, code: null })

    await page.getByRole('button', { name: 'Letiltás' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Letiltom' }).click()
    await expect.poll(() => disabledId).toBe('1')
  })
})
