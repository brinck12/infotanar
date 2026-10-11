import { expect, test } from '../../src/fixtures'

const USER = { id: 7, name: 'Teszt Elek', email: 'teszt@example.test', role: 'student' as const, email_verified_at: '2026-01-01T00:00:00+00:00' }
const ROW = { topic: 'szovegszerkesztes', checked: [0], notes: 'Szerveren írt jegyzet', scores: {}, attempts: 3, last_practiced_at: null }

test.describe('Szóbeli gyakorlás', () => {
  test('belépve a lista és a téma a szerver állapotát mutatja', { tag: '@regression' }, async ({ mockApi, oralPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withPreferences(null)
    await mockApi.withOralPractice([ROW])

    await oralPage.gotoList()
    await expect(oralPage.topicCard('Szövegszerkesztés')).toContainText('3 alkalommal gyakoroltad')

    await oralPage.gotoTopic('szovegszerkesztes')
    await expect(oralPage.notes).toHaveValue('Szerveren írt jegyzet')
  })

  test('a jegyzet késleltetve, egyben megy a szervernek', { tag: '@regression' }, async ({ mockApi, oralPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withPreferences(null)
    const oral = await mockApi.withOralPractice([])

    await oralPage.gotoTopic('szovegszerkesztes')
    await oralPage.notes.pressSequentially('Vázlat')

    await expect.poll(() => oral.saves().length).toBe(1)
    expect(oral.saves()[0]).toMatchObject({ topic: 'szovegszerkesztes', body: { notes: 'Vázlat' } })
  })

  test('a gyakorlás végét rögzíti a szerver', { tag: '@regression' }, async ({ mockApi, oralPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withPreferences(null)
    const oral = await mockApi.withOralPractice([])

    await oralPage.gotoTopic('szovegszerkesztes')
    await oralPage.practiceOnce()

    await expect(oralPage.recorded).toBeVisible()
    expect(oral.attempts()).toEqual(['szovegszerkesztes'])
  })

  test('a böngészőben mentett gyakorlás átkerül a szerverre', { tag: '@regression' }, async ({ mockApi, oralPage, page }) => {
    const local = { checked: [1], notes: 'Régi jegyzet', scores: {}, attempts: 2 }
    await page.addInitScript((value) => { localStorage.setItem('infotanar.oral.v1.u7.szovegszerkesztes', JSON.stringify(value)); }, local)
    await mockApi.signIn(USER)
    await mockApi.withPreferences(null)
    const oral = await mockApi.withOralPractice([])

    await oralPage.gotoList()

    await expect.poll(() => oral.attempts().length).toBe(2)
    expect(oral.saves()[0]).toMatchObject({ body: { notes: 'Régi jegyzet', checked: [1] } })
    await expect.poll(() => page.evaluate(() => localStorage.getItem('infotanar.oral.v1.u7.szovegszerkesztes'))).toBeNull()
  })

  test('a végpont nélkül a böngésző őrzi a gyakorlást', { tag: '@regression' }, async ({ mockApi, oralPage, page }) => {
    await mockApi.signIn(USER)
    await mockApi.withPreferences('missing')
    await mockApi.withOralPractice('missing')

    await oralPage.gotoTopic('szovegszerkesztes')
    await oralPage.practiceOnce()

    await expect(oralPage.recorded).toBeVisible()
    const stored = await page.evaluate(() => localStorage.getItem('infotanar.oral.v1.u7.szovegszerkesztes'))
    expect(stored).toContain('"attempts":1')
  })

  test('ha a lista nem töltődik be, hibát látsz, és semmi nem megy a szervernek', { tag: '@regression' }, async ({ mockApi, oralPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withPreferences(null)
    const oral = await mockApi.withOralPractice('error')

    await oralPage.gotoTopic('szovegszerkesztes')

    await expect(oralPage.loadError).toBeVisible()
    await expect(oralPage.notes).toHaveCount(0)
    expect(oral.saves()).toEqual([])
  })
})
