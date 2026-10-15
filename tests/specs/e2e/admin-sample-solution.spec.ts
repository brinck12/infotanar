import { expect, test } from '../../src/fixtures'

const ADMIN = { id: 1, name: 'Admin Anna', email: 'admin@example.test', role: 'admin' as const, email_verified_at: '2026-01-01T00:00:00+00:00' }

const ECHO = 'print(input())'

/** Egy nyelv futasa a mintamegoldassal: a 2. teszteset rejtett, es a (szerver altal nem szurt) uzenet nem johet ki. */
const VERIFICATION = {
  exercise_id: 100,
  title: 'Visszhang',
  kind: 'code',
  status: 'failed',
  message: null,
  runs: [
    {
      language: 'python',
      passed: false,
      verdict: 'wrong_answer',
      verdict_label: 'Hibás válasz',
      score: 1,
      max_score: 3,
      tests: [
        { test_case_id: 5, hidden: false, passed: true, verdict: 'accepted', verdict_label: 'Elfogadva', time: '0.01', message: null },
        { test_case_id: 6, hidden: true, passed: false, verdict: 'wrong_answer', verdict_label: 'Hibás válasz', time: '0.01', message: 'TITKOS-ELVART-KIMENET' },
        { test_case_id: 7, hidden: false, passed: false, verdict: 'wrong_answer', verdict_label: 'Hibás válasz', time: '0.01', message: 'Eltérés: 3 helyett 4' },
      ],
    },
  ],
}

test.describe('Admin: mintamegoldás és ellenőrzés', () => {
  test('a mintamegoldás elmenthető, az ellenőrzés tesztesetenként mutatja az eredményt', { tag: '@regression' }, async ({ mockApi, adminExercisePage: page }) => {
    await mockApi.signIn(ADMIN)
    const admin = await mockApi.withAdminAuthoring({ testCases: [{ id: 5, order: 1 }], verification: VERIFICATION })

    await page.gotoNew(1)
    await page.fillBasics('Visszhang')
    await page.save.click()
    await expect(page.page).toHaveURL(/feladatok\/100$/)

    await page.tab('Mintamegoldás').click()
    await page.typeSample(ECHO)
    // Az ellenőrzés a mentett állapotot futtatja: mentetlen szerkesztésnél figyelmeztet.
    await expect(page.unsavedWarning).toBeVisible()

    await page.save.click()
    await expect(page.saved).toBeVisible()
    expect(admin.lastBody('PUT', '/admin/exercises/100')).toMatchObject({ sample_solutions: { python: ECHO } })
    await expect(page.unsavedWarning).toHaveCount(0)

    await page.verifyButton.click()
    await expect(page.verifyResult).toContainText('Az ellenőrzés hibát talált')
    await expect(page.verifyRow('1. teszteset')).toContainText('Sikeres')
    await expect(page.verifyRow('3. teszteset')).toContainText('Eltérés: 3 helyett 4')

    // Rejtett tesztesetnél csak a siker látszik, a kimenet nem.
    await expect(page.verifyRow('2. teszteset')).toContainText('Rejtett')
    await expect(page.verifyRow('2. teszteset')).toContainText('Sikertelen')
    await expect(page.verifyResult).not.toContainText('TITKOS-ELVART-KIMENET')
  })

  test('nem szerkesztős típusnál nincs mintamegoldás fül', { tag: '@regression' }, async ({ mockApi, adminExercisePage: page }) => {
    await mockApi.signIn(ADMIN)
    await mockApi.withAdminAuthoring()

    await page.gotoNew(1)
    await expect(page.tab('Mintamegoldás')).toHaveCount(1)
    await page.kind.selectOption({ label: 'Táblázatkezelés (fájlfeltöltés)' })
    await expect(page.tab('Mintamegoldás')).toHaveCount(0)
  })

  test('mintamegoldás nélkül a közzététel el sem indul, és a hiba a kapcsoló mellett a megoldó fülre visz', { tag: '@regression' }, async ({ mockApi, adminExercisePage: page }) => {
    await mockApi.signIn(ADMIN)
    const admin = await mockApi.withAdminAuthoring({ testCases: [{ id: 5, order: 1 }] })

    await page.gotoNew(1)
    await page.fillBasics('Visszhang')
    await page.save.click()
    await expect(page.page).toHaveURL(/feladatok\/100$/)

    await page.published.click()
    await page.save.click()

    await expect(page.publishError).toContainText('mintamegoldást')
    expect(admin.calls.filter((call) => call.method === 'PUT' && call.path === '/admin/exercises/100')).toHaveLength(0)

    await page.openSampleTab.click()
    await expect(page.sampleEditor).toBeVisible()
  })

  test('a szerver közzétételi hibája (422) a kapcsoló mellett jelenik meg', { tag: '@regression' }, async ({ mockApi, adminExercisePage: page }) => {
    await mockApi.signIn(ADMIN)
    await mockApi.withAdminAuthoring({ testCases: [{ id: 5, order: 1 }], publishErrors: ['A feladat nem publikálható: a mintamegoldás hibás.'] })

    await page.gotoNew(1)
    await page.fillBasics('Visszhang')
    await page.save.click()
    await expect(page.page).toHaveURL(/feladatok\/100$/)

    await page.tab('Mintamegoldás').click()
    await page.typeSample(ECHO)
    await page.published.click()
    await page.save.click()

    await expect(page.publishError).toContainText('A feladat nem publikálható: a mintamegoldás hibás.')
    await expect(page.published).toBeVisible()
  })
})
