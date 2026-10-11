import { buildExamAttempt, buildExamDetail } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const USER = { id: 7, name: 'Teszt Elek', email: 'teszt@example.test', role: 'student' as const, email_verified_at: '2026-01-01T00:00:00+00:00' }

test.describe('Gyakorló vizsga', () => {
  test('a számláló a szerver órájához igazodik, nem a gépéhez', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    // A szerver órája 10 perccel előre jár: a gépen még 60 perc látszana, a szerver szerint 50 van hátra.
    const now = Date.now()
    await mockApi.signIn(USER)
    await mockApi.withExams([], {
      detail: buildExamDetail(),
      attempt: buildExamAttempt({
        started_at: new Date(now - 5 * 60 * 1000).toISOString(),
        deadline: new Date(now + 60 * 60 * 1000).toISOString(),
        server_time: new Date(now + 10 * 60 * 1000).toISOString(),
      }),
    })

    await examPage.gotoRunner(5, 9)

    await expect(examPage.timer).toContainText(/00:(49|50):/)
  })

  test('a zárolt indítás mellett megjelenik a következő lépés', { tag: '@regression' }, async ({ mockApi, examPage }) => {
    await mockApi.signIn(USER)
    await mockApi.withExams([], {
      detail: buildExamDetail(),
      startError: { status: 403, body: { message: 'A gyakorló vizsgák Prémium előfizetéshez kötöttek.', reason: 'subscription_required' } },
    })

    await examPage.gotoStart(5)
    await examPage.startButton.click()

    await expect(examPage.premiumLink).toBeVisible()
  })
})
