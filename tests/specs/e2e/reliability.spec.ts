import { buildExamAttempt, buildExamDetail, buildExamResult, buildTaskDetail, buildTopic } from '../../src/data'
import { expect, test } from '../../src/fixtures'
import type { TaskDetail } from '../../src/api/types'

const USER = { id: 7, name: 'Teszt Elek', email: 'teszt@example.test', role: 'student' as const, email_verified_at: '2026-01-01T00:00:00+00:00' }

/** Egy futo vizsga, amelynek az elso reszehez mar van feltoltott fajl. */
const UPLOADED = [{ part_id: 11, file_name: 'regi.xlsx', uploaded_at: '2026-05-01T10:00:00+00:00' }]

test.describe('Vizsgafuto megbízhatósága', () => {
  test.beforeEach(async ({ mockApi }) => {
    await mockApi.signIn(USER)
  })

  test('a kész állapotban is látszik, hogy az új fájl nem került be', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    await mockApi.withExams([], { detail: buildExamDetail(), attempt: buildExamAttempt({ submissions: UPLOADED }) })
    await mockApi.onExamPartUpload({ status: 422, body: { message: 'Makrós fájlt nem fogadunk el.' } })

    await examPage.gotoRunner(5, 9)
    await examPage.chooseFile('uj.xlsm')

    await expect(examPage.alert).toContainText('Az új fájl NEM került be')
    await expect(examPage.alert).toContainText('Makrós fájlt nem fogadunk el.')
    await expect(examPage.alert).toContainText('regi.xlsx')
  })

  test('409 a feltöltésnél az eredményre visz magyarázattal', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    await mockApi.withExams([], { detail: buildExamDetail(), attempt: buildExamAttempt() })
    await mockApi.withExamResult(buildExamResult())
    await mockApi.onExamPartUpload({ status: 409, body: { message: 'A vizsga már le van zárva.' } })

    await examPage.gotoRunner(5, 9)
    await examPage.chooseFile('uj.xlsx')

    await expect(examPage.resultTitle).toBeVisible()
    await expect(examPage.closedNotice).toBeVisible()
  })

  test('a lejáratkori automatikus beadás hibánál újrapróbál, és látható a hiba', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    const now = Date.now()
    await mockApi.withExams([], {
      detail: buildExamDetail(),
      attempt: buildExamAttempt({
        started_at: new Date(now - 60_000).toISOString(),
        deadline: new Date(now + 2000).toISOString(),
        server_time: new Date(now).toISOString(),
      }),
    })
    await mockApi.withExamResult(buildExamResult())
    // Az első két kísérlet elbukik, a harmadik sikerül.
    const submits = await mockApi.onExamSubmit((call) =>
      call < 3 ? { status: 503, body: { message: 'A szerver most nem érhető el.' } } : { status: 200, body: { data: buildExamAttempt({ state: 'submitted' }) } },
    )

    await examPage.gotoRunner(5, 9)

    await expect(examPage.alert).toContainText('Lejárt az idő, de a beadás nem sikerült')
    await expect(examPage.alert).toContainText('A szerver most nem érhető el.')
    await expect(examPage.alert.getByRole('button', { name: 'Beadás' })).toBeVisible()
    await expect(examPage.resultTitle).toBeVisible({ timeout: 15_000 })
    expect(submits()).toBe(3)
  })

  test('a lejárati sávból kézzel is beadható', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    const now = Date.now()
    await mockApi.withExams([], {
      detail: buildExamDetail(),
      attempt: buildExamAttempt({
        started_at: new Date(now - 60_000).toISOString(),
        deadline: new Date(now + 1000).toISOString(),
        server_time: new Date(now).toISOString(),
      }),
    })
    await mockApi.withExamResult(buildExamResult())
    let healthy = false
    await mockApi.onExamSubmit(() => (healthy ? { status: 200, body: { data: buildExamAttempt({ state: 'submitted' }) } } : { status: 503, body: { message: 'Hiba.' } }))

    await examPage.gotoRunner(5, 9)
    await expect(examPage.alert).toContainText('a beadás nem sikerült')
    healthy = true
    await examPage.alert.getByRole('button', { name: 'Beadás' }).click()

    await expect(examPage.resultTitle).toBeVisible()
  })

  test('futó vizsgán a lap bezárása és a logó megerősítést kér', { tag: '@regression' }, async ({ mockApi, examPage, page }) => {
    await mockApi.withExams([], { detail: buildExamDetail(), attempt: buildExamAttempt() })

    await examPage.gotoRunner(5, 9)
    await expect(examPage.timer).toBeVisible()
    expect(await examPage.unloadWouldWarn()).toBe(true)

    await examPage.logoLink.click()
    await expect(examPage.leaveDialog).toBeVisible()
    await examPage.stayButton.click()
    await expect(examPage.leaveDialog).toBeHidden()
    await expect(page).toHaveURL(/\/vizsgak\/5\/fut/)
  })

  test('10 perc alatt a számláló színt vált és bemondja a hátralévő időt', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    const now = Date.now()
    await mockApi.withExams([], {
      detail: buildExamDetail(),
      attempt: buildExamAttempt({
        started_at: new Date(now - 50 * 60_000).toISOString(),
        deadline: new Date(now + 4 * 60_000).toISOString(),
        server_time: new Date(now).toISOString(),
      }),
    })

    await examPage.gotoRunner(5, 9)

    await expect(examPage.liveAnnouncement(/már csak 5 perc van hátra/)).toHaveCount(1)
  })

  test('a vizsga forrásfájl-csomagja a futó nézetben is letölthető', { tag: '@regression' }, async ({ mockApi, examPage, page }) => {
    await mockApi.withExams([], {
      detail: buildExamDetail({ source_zip: { name: 'forrasok.zip', size: 2048, url: 'http://127.0.0.1/forrasok.zip' } }),
      attempt: buildExamAttempt(),
    })

    await examPage.gotoRunner(5, 9)

    await expect(page.getByRole('link', { name: 'forrasok.zip letöltése' })).toBeVisible()
  })

  test('a szerkesztőből visszatérve a beadás ablak az új állapotot mutatja', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    let attempt = buildExamAttempt()
    await mockApi.withExams([], { detail: buildExamDetail(), attemptOf: () => attempt })

    await examPage.gotoRunner(5, 9)
    await expect(examPage.partStatus('Nincs feltöltve')).toBeVisible()

    // A másik lapon megoldott rész: a lapra visszatérve (fókusz) a pipa megjelenik.
    attempt = buildExamAttempt({ submissions: UPLOADED })
    await examPage.returnToTab()

    await expect(examPage.partStatus('Feltöltve')).toBeVisible()
  })
})

test.describe('Gyakorló táblázat', () => {
  const task: TaskDetail = Object.assign(buildTaskDetail({ id: 9, title: 'Táblázat gyakorló' }), {
    sheet_practice: {
      columns: 3,
      rows: 4,
      cells: { A1: 'Szám', A2: '5', A3: '7' },
      checks: [{ id: 1, label: 'B3 képlet', type: 'has_formula', cell: 'B3' }],
    },
  })

  test.beforeEach(async ({ mockApi }) => {
    await mockApi.signIn(USER)
    await mockApi.withoutSubscription()
    await mockApi.withCatalog({ topics: [buildTopic()], tasks: [task] })
  })

  test('a beírt képlet újratöltés után is megvan', { tag: '@regression' }, async ({ sheetPracticePage }) => {
    await sheetPracticePage.goto(9)
    await sheetPracticePage.typeIntoCell('B3', '=A2+A3')
    await expect(sheetPracticePage.cell('B3')).toHaveAccessibleName('B3: 12')

    await sheetPracticePage.page.reload()

    await expect(sheetPracticePage.cell('B3')).toHaveAccessibleName('B3: 12')
  })

  test('a hibaértékű képlet nem kap pontot, és rövid tippet látni', { tag: '@regression' }, async ({ sheetPracticePage }) => {
    await sheetPracticePage.goto(9)
    await sheetPracticePage.typeIntoCell('B3', '=SUM(A2:A3)')

    await expect(sheetPracticePage.checkItem('B3 képlet')).toContainText('A függvények magyarul vannak')
    await expect(sheetPracticePage.page.getByText('0 / 1 kész')).toBeVisible()
  })
})

test.describe('Személyes adatok kijelentkezéskor', () => {
  test('a kijelentkezés törli a felhasználóhoz kötött böngészőadatot', { tag: '@regression' }, async ({ mockApi, page }) => {
    await mockApi.signIn(USER)
    await mockApi.withCatalog()
    await mockApi.onLogout()
    await page.addInitScript(() => {
      localStorage.setItem('infotanar.draft.v1.u7.1.python', '{"code":"x","savedAt":1}')
      localStorage.setItem('infotanar.oral.v1.u7.szovegszerkesztes', '{}')
      localStorage.setItem('infotanar.draft.v1.u8.1.python', '{"code":"y","savedAt":1}')
    })

    await page.goto('/fiok')
    await page.getByRole('button', { name: 'Kilépés' }).click()

    await expect(page).toHaveURL('/')
    const keys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('infotanar.')))
    expect(keys).toContain('infotanar.draft.v1.u8.1.python')
    expect(keys).not.toContain('infotanar.draft.v1.u7.1.python')
    expect(keys).not.toContain('infotanar.oral.v1.u7.szovegszerkesztes')
  })
})
