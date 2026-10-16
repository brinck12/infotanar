import { buildExamAttempt, buildExamDetail, buildTaskDetail, buildTopic } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const USER = { id: 7, name: 'Teszt Elek', email: 'teszt@example.test', role: 'student' as const, email_verified_at: '2026-01-01T00:00:00+00:00' }

const runningSummary = { id: 9, state: 'in_progress', score: null, max_score: 100, completed_parts: [] }

test.describe('Gyakorló vizsga: indítás és futás', () => {
  test('az indítás alapértelmezett módja a gyakorlás', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withExams([], { detail: buildExamDetail() })

    await examPage.gotoStart(5)

    await expect(examPage.practiceMode).toBeChecked()
  })

  test('zárolt vizsgánál már betöltéskor a vizsgára szabott üzenet látszik', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    await mockApi.signIn(USER)
    const locked = buildExamDetail()
    await mockApi.withExams([], {
      detail: { ...locked, parts: (locked.parts as object[]).map((part) => ({ ...part, description: '' })) },
    })

    await examPage.gotoStart(5)

    await expect(examPage.lockBanner).toContainText('gyakorló feladatsor Prémium előfizetéshez kötött')
    await expect(examPage.lockBanner).not.toContainText('lecke')
    await expect(examPage.premiumLink).toBeVisible()
    await expect(examPage.startButton).toBeDisabled()
  })

  test('futó próbálkozásnál sáv jelenik meg, eltérő módnál pedig figyelmeztetés', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withExams([], {
      detail: buildExamDetail({ attempt: runningSummary }),
      attempt: buildExamAttempt({ mode: 'exam' }),
    })

    await examPage.gotoStart(5)

    await expect(examPage.runningBanner).toContainText('Fut egy próbálkozásod')
    // Az alapértelmezett mód a gyakorlás, a futó próbálkozás viszont vizsgahelyzet.
    await expect(examPage.modeMismatch).toContainText('vizsgahelyzet')
  })

  test('a vizsgalistán látszik a futó próbálkozás', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withExams([buildExamDetail({ attempt: runningSummary })])

    await examPage.gotoList()

    await expect(examPage.runningBanner).toContainText('Fut egy próbálkozásod')
    await expect(examPage.runningBanner.getByRole('link', { name: 'Folytatás' })).toHaveAttribute('href', '/vizsgak/5/fut?proba=9')
  })

  test('a szerkesztőből megnyitott kódrész fölött látszik a vizsga ideje és a visszalépés', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    const task = buildTaskDetail()
    await mockApi.signIn(USER)
    await mockApi.withCatalog({ topics: [buildTopic()], tasks: [task] })
    await mockApi.withExams([], { detail: buildExamDetail(), attempt: buildExamAttempt() })

    await examPage.gotoTaskFromExam(task.id, 5, 9)

    await expect(examPage.examStrip.getByRole('timer')).toContainText(/00:(59|60|[0-5]\d):/)
    await expect(examPage.examStrip.getByRole('link', { name: 'Vissza a vizsgához' })).toHaveAttribute('href', '/vizsgak/5/fut?proba=9')
  })

  test('a vizsgára visszatérve a kész rész pipája magától frissül', { tag: '@regression' }, async ({ mockApi, examPage, page }) => {
    const codePart = (buildExamDetail().parts as object[])[0]
    await mockApi.signIn(USER)
    await mockApi.withExams([], { detail: buildExamDetail({ parts: [{ ...codePart, exercise_id: 1, deliverable: null }] }) })
    let solved = false
    await page.route('**/api/v1/exam-attempts/9', (route) =>
      route.fulfill({
        json: {
          data: buildExamAttempt({
            submissions: solved ? [{ part_id: 11, file_name: 'megoldas.py', uploaded_at: new Date().toISOString() }] : [],
          }),
        },
      }),
    )

    await examPage.gotoRunner(5, 9)
    await expect(page.getByRole('button', { name: /Nincs feltöltve/ })).toBeVisible()

    solved = true
    await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))

    await expect(page.getByRole('button', { name: /Feltöltve/ })).toBeVisible()
  })
})

const RESULT = {
  attempt_id: 9,
  exam: { ...buildExamDetail(), parts: [] },
  score: 90,
  max_score: 100,
  pending_manual_points: 0,
  parts: [{ part_id: 11, score: 90, max_score: 100, summary: null, file_submission_id: 31 }],
  review: [],
}

test.describe('Gyakorló vizsga: eredmény', () => {
  test('az eredményoldal kimondja, hogy megoldottnak számít-e, és mutatja a módot', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withExams([], { attempt: buildExamAttempt({ state: 'evaluated', mode: 'exam' }) })
    await mockApi.withExamResult(RESULT)

    await examPage.gotoResult(5, 9)

    await expect(examPage.solvedVerdict).toContainText('megoldottnak számít')
    await expect(examPage.attemptMode).toContainText('Vizsgahelyzetben')
  })

  test('80 százalék alatt az eredményoldal nem számít megoldottnak', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withExams([], { attempt: buildExamAttempt({ state: 'evaluated', mode: 'practice', deadline: null }) })
    await mockApi.withExamResult({ ...RESULT, score: 60 })

    await examPage.gotoResult(5, 9)

    await expect(examPage.solvedVerdict).toContainText('még nem számít megoldottnak')
    await expect(examPage.attemptMode).toContainText('Gyakorló módban')
  })
})

const SUBMISSION = {
  id: 31,
  exercise_id: 1,
  exercise_title: 'Táblázatkezelés',
  attempt: 1,
  status: 'evaluated',
  score: 9,
  max_score: 10,
  previous_score: null,
  file: { name: 'hyrox.xlsx', size: 2048, uploaded_at: '2026-01-01T10:00:00+00:00' },
  groups: [],
  items: [],
  facts: [],
  preview_url: null,
  sample_url: null,
  error: null,
}

test.describe('Értékelőlap a vizsgaeredményből', () => {
  test('a vizsgából nyitva visszavezet az eredményhez, és kimondja a megoldottságot', { tag: '@regression' }, async ({ mockApi, page }) => {
    await mockApi.signIn(USER)
    await mockApi.withFileTask([SUBMISSION])

    await page.goto('/beadasok/31?vizsga=5&proba=9')

    await expect(page.getByTestId('solved-verdict')).toContainText('megoldottnak számít')
    await expect(page.getByRole('link', { name: 'Vissza az eredményhez' })).toHaveAttribute('href', '/vizsgak/5/eredmeny?proba=9')
  })
})
