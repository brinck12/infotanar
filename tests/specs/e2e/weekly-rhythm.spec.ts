import { buildRhythm, buildStudent } from '../../src/data'
import { expect, test } from '../../src/fixtures'

/**
 * Heti ritmus a böngészőben (mockolt API): a sáv, a heti összefoglaló egyszeri felkínálása, a kapcsoló a fiókoldalon
 * és a leiratkozó oldal. A hangnem kedves: nincs szám, széria vagy lemaradás; a nem teljesült cél sehol nem látszik.
 * A számítást és a küldést a backend (API-tesztek) fedi.
 */

const STUDENT = buildStudent()

test.describe('Heti ritmussáv', () => {
  test('a hét hét napját mutatja, a tanulással töltöttek kitöltve, a mai nap jelölve, szám nélkül', { tag: '@smoke' }, async ({ mockApi, progressPage }) => {
    await mockApi.signIn(STUDENT)
    await mockApi.withRhythm(buildRhythm([0, 3]))

    await progressPage.goto()

    await expect(progressPage.card).toBeVisible()
    await expect(progressPage.days).toHaveCount(7)
    await expect(progressPage.day('hétfő, volt tanulás')).toBeVisible()
    await expect(progressPage.day('csütörtök (ma), volt tanulás')).toBeVisible()
    await expect(progressPage.day('kedd')).toBeVisible()
    await expect(progressPage.day('vasárnap')).toBeVisible()
    await expect(progressPage.card).not.toHaveText(/\d/)
  })

  test('a mai nap akkor is jelölt, ha aznap még nem tanult, és semmi nem mond rá szemrehányást', { tag: '@regression' }, async ({ mockApi, progressPage }) => {
    await mockApi.signIn(STUDENT)
    await mockApi.withRhythm(buildRhythm([]))

    await progressPage.goto()

    await expect(progressPage.day('csütörtök (ma)')).toBeVisible()
    await expect(progressPage.card).not.toContainText(/lemaradt|hiányz|megszakad|elveszt|széria/i)
  })

  test('a heti cél elérésekor ünneplő mondat jelenik meg', { tag: '@smoke' }, async ({ mockApi, progressPage }) => {
    await mockApi.signIn(STUDENT)
    await mockApi.withRhythm(buildRhythm([0, 1], { goal_days: 2, goal_reached: true }))

    await progressPage.goto()

    await expect(progressPage.goalReached).toBeVisible()
  })

  test('a nem teljesült cél sehol nem látszik: se mondat, se jelölés', { tag: '@regression' }, async ({ mockApi, progressPage }) => {
    await mockApi.signIn(STUDENT)
    await mockApi.withRhythm(buildRhythm([0], { goal_days: 3, goal_reached: false }))

    await progressPage.goto()

    await expect(progressPage.card).toBeVisible()
    await expect(progressPage.goalReached).toHaveCount(0)
    await expect(progressPage.card).not.toContainText(/cél|3 nap|kellene/i)
  })

  test('a tanulási út tetején is ott van bejelentkezve', { tag: '@regression' }, async ({ mockApi, progressPage }) => {
    await mockApi.signIn(STUDENT)
    await mockApi.withRhythm(buildRhythm([2]))

    await progressPage.goto('/tanulasi-ut')

    await expect(progressPage.day('szerda, volt tanulás')).toBeVisible()
  })

  test('a végpont hibájánál a kártya nem jelenik meg, és az oldal többi része működik', { tag: '@regression' }, async ({ mockApi, progressPage, page }) => {
    await mockApi.signIn(STUDENT)
    await mockApi.withRhythm('error')
    await page.route('**/api/v1/progress', (route) => route.fulfill({ json: { data: { overall: { completed: 0, total: 0, percent: 0 }, tracks: [] } } }))

    await progressPage.goto()

    await expect(progressPage.pageHeading).toBeVisible()
    await expect(progressPage.card).toHaveCount(0)
  })

  test('vendégnek nincs kártya, és kérés sem megy a végpontra', { tag: '@regression' }, async ({ mockApi, progressPage, page }) => {
    const calls: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/progress/rhythm')) calls.push(request.url())
    })
    await mockApi.withRhythm(buildRhythm([0]))

    await progressPage.goto('/tanulasi-ut')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(progressPage.card).toHaveCount(0)
    expect(calls).toHaveLength(0)
  })
})

test.describe('Heti összefoglaló felkínálása a kártyán', () => {
  test('a megerősített, nem feliratkozott diáknak felkínáljuk; a „Kérem” a látott adatkezelési verzióval kapcsol be, és megköszöni', { tag: '@smoke' }, async ({ mockApi, progressPage }) => {
    const summary = await mockApi.withWeeklySummary(STUDENT)
    await mockApi.withRhythm(buildRhythm([0]))
    await progressPage.goto()

    await expect(progressPage.offerQuestion).toBeVisible()
    await progressPage.acceptOffer.click()

    await expect(progressPage.offerThanks).toBeVisible()
    await expect(progressPage.offerQuestion).toHaveCount(0)
    expect(summary.puts()).toEqual([{ enabled: true, privacy_version: expect.stringMatching(/^\d+\.\d+$/) }])
  })

  test('a feliratkozás után újratöltve már nem kérdezünk, és nincs ismételt köszönet sem', { tag: '@regression' }, async ({ mockApi, progressPage, page }) => {
    await mockApi.withWeeklySummary(STUDENT)
    await mockApi.withRhythm(buildRhythm([0]))
    await progressPage.goto()
    await progressPage.acceptOffer.click()
    await expect(progressPage.offerThanks).toBeVisible()

    await page.reload()

    await expect(progressPage.card).toBeVisible()
    await expect(progressPage.offerQuestion).toHaveCount(0)
    await expect(progressPage.offerThanks).toHaveCount(0)
  })

  test('a „Most nem” megjegyződik: újratöltés után sem kérdezünk, és semmit nem kapcsolunk be', { tag: '@smoke' }, async ({ mockApi, progressPage, page }) => {
    const summary = await mockApi.withWeeklySummary(STUDENT)
    await mockApi.withRhythm(buildRhythm([0]))
    await progressPage.goto()

    await progressPage.declineOffer.click()
    await expect(progressPage.offerQuestion).toHaveCount(0)
    await page.reload()

    await expect(progressPage.card).toBeVisible()
    await expect(progressPage.offerQuestion).toHaveCount(0)
    expect(summary.puts()).toHaveLength(0)
    expect(await page.evaluate(() => localStorage.getItem('infotanar.rhythm.offer.v1.u7'))).not.toBeNull()
  })

  test('megerősítetlen e-mail-címnél nincs felkínálás', { tag: '@regression' }, async ({ mockApi, progressPage }) => {
    await mockApi.withWeeklySummary(buildStudent({ email_verified_at: null }))
    await mockApi.withRhythm(buildRhythm([0]))

    await progressPage.goto()

    await expect(progressPage.card).toBeVisible()
    await expect(progressPage.offerQuestion).toHaveCount(0)
  })

  test('a már feliratkozott diáknak nincs felkínálás', { tag: '@regression' }, async ({ mockApi, progressPage }) => {
    await mockApi.withWeeklySummary(buildStudent({ weekly_summary: true }))
    await mockApi.withRhythm(buildRhythm([0]))

    await progressPage.goto()

    await expect(progressPage.card).toBeVisible()
    await expect(progressPage.offerQuestion).toHaveCount(0)
  })

  test('ha a bekapcsolás hibára fut, a szerver üzenete látszik, és a felkínálás megmarad', { tag: '@regression' }, async ({ mockApi, progressPage, page }) => {
    await mockApi.withWeeklySummary(STUDENT)
    await mockApi.withRhythm(buildRhythm([0]))
    await page.route('**/api/v1/account/notifications', (route) =>
      route.fulfill({ status: 422, json: { message: 'A heti összefoglalóhoz előbb erősítsd meg az e-mail-címedet.' } })
    )
    await progressPage.goto()

    await progressPage.acceptOffer.click()

    await expect(progressPage.offerError).toContainText('előbb erősítsd meg az e-mail-címedet')
    await expect(progressPage.offerQuestion).toBeVisible()
    await expect(progressPage.offerThanks).toHaveCount(0)
  })
})

test.describe('Értesítések a fiókoldalon', () => {
  test('a kapcsoló a szerver állapotát mutatja; be- és kikapcsolás a látott verzióval, illetve anélkül megy', { tag: '@smoke' }, async ({ mockApi, accountPage }) => {
    const summary = await mockApi.withWeeklySummary(STUDENT)
    await accountPage.goto()
    await expect(accountPage.weeklySummarySwitch).not.toBeChecked()

    await accountPage.weeklySummarySwitch.click()
    await expect(accountPage.weeklySummarySwitch).toBeChecked()
    await accountPage.weeklySummarySwitch.click()
    await expect(accountPage.weeklySummarySwitch).not.toBeChecked()

    expect(summary.puts()).toEqual([{ enabled: true, privacy_version: expect.stringMatching(/^\d+\.\d+$/) }, { enabled: false }])
  })

  test('a feliratkozott felhasználónál eleve bekapcsolt, és újratöltés után is az marad', { tag: '@regression' }, async ({ mockApi, accountPage, page }) => {
    await mockApi.withWeeklySummary(buildStudent({ weekly_summary: true }))
    await accountPage.goto()
    await expect(accountPage.weeklySummarySwitch).toBeChecked()

    await page.reload()

    await expect(accountPage.weeklySummarySwitch).toBeChecked()
  })

  test('megerősítetlen e-mail-címnél a kapcsoló tiltott, és a magyarázat megmondja, mit tegyen', { tag: '@regression' }, async ({ mockApi, accountPage }) => {
    await mockApi.withWeeklySummary(buildStudent({ email_verified_at: null }))

    await accountPage.goto()

    await expect(accountPage.weeklySummarySwitch).toBeDisabled()
    await expect(accountPage.verifyEmailFirst).toBeVisible()
  })

  test('a leírás megmondja, mit kap és hogy bármikor kikapcsolható, nyomás nélkül', { tag: '@regression' }, async ({ mockApi, accountPage, page }) => {
    await mockApi.withWeeklySummary(STUDENT)

    await accountPage.goto()

    await expect(page.getByText('Csak akkor érkezik, ha azon a héten tanultál, és bármikor kikapcsolhatod.')).toBeVisible()
  })
})

test.describe('Leiratkozó oldal (/leiratkozas)', () => {
  test('a link megnyitása még nem iratkoztat le: gombnyomás kell, és a kérés az aláírással megy', { tag: '@smoke' }, async ({ mockApi, page }) => {
    const urls = await mockApi.onUnsubscribe()

    await page.goto('/leiratkozas?id=7&signature=abc123')
    const button = page.getByRole('button', { name: 'Leiratkozom a heti összefoglalóról' })
    await expect(button).toBeVisible()
    expect(urls(), 'megnyitáskor nem megy kérés').toHaveLength(0)
    await button.click()

    await expect(page.getByRole('heading', { name: 'Leiratkoztál' })).toBeVisible()
    await expect(page.getByText('Nem küldünk több heti összefoglalót.')).toBeVisible()
    expect(urls()).toHaveLength(1)
    expect(urls()[0]).toMatch(/\/notifications\/weekly-summary\/7\/unsubscribe\?signature=abc123$/)
  })

  test('érvénytelen aláírásnál érthető hiba látszik, nem a „Leiratkoztál”, és újra lehet próbálni', { tag: '@regression' }, async ({ mockApi, page }) => {
    await mockApi.onUnsubscribe({ status: 403 })

    await page.goto('/leiratkozas?id=7&signature=hamis')
    await page.getByRole('button', { name: 'Leiratkozom a heti összefoglalóról' }).click()

    await expect(page.getByRole('alert')).toContainText('Érvénytelen aláírás.')
    await expect(page.getByRole('heading', { name: 'Leiratkoztál' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Leiratkozom a heti összefoglalóról' })).toBeEnabled()
  })

  test('hiányzó paramétereknél „Ez a link nem érvényes”, és a fiókoldalra mutat', { tag: '@regression' }, async ({ page }) => {
    await page.goto('/leiratkozas')

    await expect(page.getByRole('heading', { name: 'Ez a link nem érvényes' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Fiókom' })).toHaveAttribute('href', '/fiok')
  })

  test('bejelentkezés nélkül is megnyílik (a levélből érkezik valaki)', { tag: '@regression' }, async ({ mockApi, page }) => {
    await mockApi.onUnsubscribe()

    await page.goto('/leiratkozas?id=7&signature=abc123')

    await expect(page).toHaveURL(/\/leiratkozas\?/)
    await expect(page.getByRole('button', { name: 'Leiratkozom a heti összefoglalóról' })).toBeVisible()
  })
})
