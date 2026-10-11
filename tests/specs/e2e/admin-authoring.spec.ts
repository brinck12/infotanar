import { expect, test } from '../../src/fixtures'

const ADMIN = { id: 1, name: 'Admin Anna', email: 'admin@example.test', role: 'admin' as const, email_verified_at: '2026-01-01T00:00:00+00:00' }

test.describe('Admin: új típusú tartalom szerkesztése', () => {
  test('táblázatfeladat létrehozása a típustól a közzétételig', { tag: '@regression' }, async ({ mockApi, adminExercisePage: page }) => {
    await mockApi.signIn(ADMIN)
    const admin = await mockApi.withAdminAuthoring()

    await page.gotoNew(1)
    await page.kind.selectOption({ label: 'Táblázatkezelés (fájlfeltöltés)' })
    await page.fillBasics('Hyrox')

    // A szerkesztős mezők nem jelennek meg fájlfeltöltős típusnál.
    await expect(page.page.getByText('Kiinduló kód')).toHaveCount(0)
    await expect(page.page.getByRole('tab', { name: 'Tesztesetek' })).toHaveCount(0)

    await page.tab('Típus-adatok').click()
    await page.steps.fill('Töltsd be a hyrox.txt fájlt.\nSzámold ki az összidőt.')
    await page.deliverable.fill('hyrox')
    await page.extension('.xlsx').check()
    await page.software.fill('Excel, LibreOffice Calc')
    await page.examPoints.fill('35')
    await page.save.click()

    await expect(page.page).toHaveURL(/\/admin\/tananyag\/feladatok\/100$/)
    expect(admin.lastBody('POST', '/admin/exercises')).toMatchObject({
      kind: 'sheet_upload',
      allowed_languages: [],
      starter_code: {},
      comparison: null,
      spec: {
        steps: ['Töltsd be a hyrox.txt fájlt.', 'Számold ki az összidőt.'],
        deliverable: 'hyrox',
        accepted_extensions: ['.xlsx'],
        software: ['Excel', 'LibreOffice Calc'],
        exam_points: 35,
        raw_points: null,
      },
    })

    // Fájlok: forrásfájl és mintamegoldás.
    await page.tab('Fájlok').click()
    await page.attach('Forrásfájl (a tanuló letöltheti)', 'hyrox.txt', 'adatok')
    await expect(page.attachmentList).toContainText('hyrox.txt')
    await page.attach('Mintamegoldás (csak adminnak)', 'minta.xlsx', 'xlsx')
    await expect(page.attachmentList).toContainText('minta.xlsx')

    // Értékelőlap: a négy új vizsgálattípus választható, a kipróbálás megmutatja a pontot.
    await page.tab('Értékelőlap').click()
    await expect(page.checkTypeOption('Munkalap és oszlopok')).toHaveCount(1)
    await expect(page.checkTypeOption('Feltételes formázás')).toHaveCount(1)
    await expect(page.checkTypeOption('Felsorolás')).toHaveCount(1)
    await expect(page.checkTypeOption('Alakzat')).toHaveCount(1)

    await page.rubricCheckType.selectOption('sheet_format')
    await page.addRubric('Munkalap neve', 'Munkalapok', 'sheet_name', 'Adatok', 3)
    await expect(page.rubricRow('Munkalap neve')).toBeVisible()
    await page.addRubric('Összeg képlettel', 'Képletek', 'B10', 'SUM', 2)
    await page.tryRubric.click()
    await expect(page.tryResult).toContainText('5 / 5 pont')

    // Közzététel.
    await page.tab('Leírás').click()
    await page.published.click()
    await page.save.click()
    await expect(page.saved).toBeVisible()
    expect(admin.lastBody('PUT', '/admin/exercises/100')).toMatchObject({ is_published: true, kind: 'sheet_upload' })
  })

  test('az értékelőlap pontja szerkeszthető', { tag: '@regression' }, async ({ mockApi, adminExercisePage: page }) => {
    await mockApi.signIn(ADMIN)
    const admin = await mockApi.withAdminAuthoring()

    await page.gotoNew(1)
    await page.kind.selectOption({ label: 'Szövegszerkesztés (fájlfeltöltés)' })
    await page.fillBasics('Levél')
    await page.save.click()
    await expect(page.page).toHaveURL(/feladatok\/100$/)

    await page.tab('Értékelőlap').click()
    await page.addRubric('Betűméret', 'Formázás', 'font_size', '12', 2)
    await page.page.getByRole('button', { name: 'Betűméret szerkesztése' }).click()
    await page.rubricPoints.fill('4')
    await page.saveRubricItem.click()

    await expect(page.rubricRow('Betűméret')).toContainText('4')
    expect(admin.lastBody('PUT', '/admin/rubric-items/100')).toMatchObject({ points: 4, label: 'Betűméret' })
  })

  test('weboldal-feladat a JSON fülön: hibás JSON nem megy el, a szerver hibája látszik', { tag: '@regression' }, async ({ mockApi, adminExercisePage: page }) => {
    await mockApi.signIn(ADMIN)
    const admin = await mockApi.withAdminAuthoring({ specErrors: ['A weboldal feladatnak legalább egy HTML fájl kell.'] })

    await page.gotoNew(1)
    await page.kind.selectOption({ label: 'Weboldal (böngészőben ellenőrzött)' })
    await page.fillBasics('Személyes oldal')
    await page.tab('Típus-adatok').click()

    await page.specJson.fill('{ "files": ')
    await page.save.click()
    await expect(page.page.getByText('A JSON nem értelmezhető')).toBeVisible()
    expect(admin.calls.filter((call) => call.method === 'POST' && call.path === '/admin/exercises')).toHaveLength(0)

    await page.specJson.fill('{ "files": [], "checks": [] }')
    await page.save.click()
    await expect(page.page.getByText('A weboldal feladatnak legalább egy HTML fájl kell.').first()).toBeVisible()

    await page.specJson.fill('{ "files": [{ "name": "index.html", "language": "html", "content": "<h1>Szia</h1>" }], "checks": [] }')
    await page.save.click()
    await expect(page.page).toHaveURL(/feladatok\/100$/)
    expect(admin.lastBody('POST', '/admin/exercises')).toMatchObject({
      kind: 'web',
      allowed_languages: [],
      spec: { files: [{ name: 'index.html', language: 'html' }] },
    })
  })

  test('kódfeladat részfeladatokkal és számtűréses összevetéssel', { tag: '@regression' }, async ({ mockApi, adminExercisePage: page }) => {
    await mockApi.signIn(ADMIN)
    const admin = await mockApi.withAdminAuthoring()

    await page.gotoNew(1)
    await page.fillBasics('Átlag')
    await page.tab('Típus-adatok').click()
    await page.page.getByRole('button', { name: 'Részfeladat hozzáadása' }).click()
    await page.page.getByLabel('1. sor: megnevezés').fill('Darabszám')
    await page.page.getByLabel('1. sor: pont').fill('2')
    await page.page.getByLabel('Az összevetés módja').selectOption('numeric')
    await page.page.getByLabel('Abszolút tűrés').fill('0.01')
    await page.save.click()

    await expect(page.page).toHaveURL(/feladatok\/100$/)
    expect(admin.lastBody('POST', '/admin/exercises')).toMatchObject({
      kind: 'code',
      allowed_languages: ['python'],
      spec: { subtasks: [{ number: 1, label: 'Darabszám', points: 2 }] },
      comparison: { mode: 'numeric', abs_tol: 0.01, rel_tol: null },
    })
  })

  test('ha az értékelőlap-végpontok még nincsenek kint, a fül ezt mondja', { tag: '@regression' }, async ({ mockApi, adminExercisePage: page }) => {
    await mockApi.signIn(ADMIN)
    await mockApi.withAdminAuthoring({ rubricAvailable: false })

    await page.gotoNew(1)
    await page.kind.selectOption({ label: 'Bemutató vagy kép (fájlfeltöltés)' })
    await page.fillBasics('Plakát')
    await page.save.click()
    await expect(page.page).toHaveURL(/feladatok\/100$/)

    await page.tab('Értékelőlap').click()
    await expect(page.rubricUnavailable).toBeVisible()
  })

  test('a vizsgához időszak és forrás zip adható, a zip törölhető', { tag: '@regression' }, async ({ mockApi, adminExamPage: page }) => {
    await mockApi.signIn(ADMIN)
    const admin = await mockApi.withAdminAuthoring()

    await page.goto(7)
    await expect(page.session).toHaveValue('2026-05')
    await page.session.selectOption('2026-10')
    await page.save.click()
    expect(admin.lastBody('PUT', '/admin/exams/7')).toMatchObject({ session: '2026-10' })

    await page.attachZip('forrasok.zip')
    await expect(page.fileLink('forrasok.zip')).toBeVisible()

    await page.fileDelete('forrasok.zip').click()
    await expect(page.fileLink('forrasok.zip')).toHaveCount(0)
  })
})
