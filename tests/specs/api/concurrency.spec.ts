/**
 * REL-1: versenyhelyzetek. Ugyanazt a muveletet egyszerre, `Promise.all`-lal tobbszor kuldjuk, es az
 * eredo allapotot az API-n at ellenorizzuk (soha nem lehet duplikalt sor, nulla admin, ketszeri ertekeles).
 *
 * FIGYELEM: ezek a tesztek csak MySQL-en (`API_DATABASE_URL`, a `backend-mysql` CI job) bizonyitanak
 * valamit. SQLite-on a `lockForUpdate` no-op, a beepitett PHP szerver (`php -S`) pedig egyszerre egy
 * kerelmet szolgal ki, ezert ott a kerelmek valojaban sorban futnak: a tesztek gyengebbek, de zoldek
 * kell legyenek (a kimeneti invarianst ez is ellenorzi). Hatarozottan nem flaky, ezert az alap `api`
 * futasban is benne vannak; kulon is futtathatok: `--grep @concurrency`.
 *
 * Kimaradt (nincs hozza stub): Barion webhook duplikalas (SyncPaymentState), dupla elofizetes/checkout,
 * megujitas terhelese (ChargeRenewal). Ezek a REL-2 stubok utan epulhetnek.
 */
import { adminAccount, premiumStudent } from '../../src/api/areas/accounts'
import { attempt as getAttempt, attemptResult, listExams, startAttempt, submitAttempt } from '../../src/api/areas/exams'
import { adminUserTotal } from '../../src/api/areas/adminOverview'
import { completeLesson, progress } from '../../src/api/areas/progress'
import { registration, SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const PARALLEL = 8
const EXAM = SEEDED.exams.main

/** `count` darab egyidejuleg inditott hivas. */
function parallel<T>(count: number, call: (index: number) => Promise<T>): Promise<T[]> {
  return Promise.all(Array.from({ length: count }, (_, index) => call(index)))
}

test.describe('Versenyhelyzetek @concurrency', () => {
  test('vizsga inditasa egyszerre: pontosan egy futo probalkozas', async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const { client } = await premiumStudent(apiClient, admin)

    const results = await parallel(PARALLEL, () => startAttempt(client, EXAM.id, 'practice'))

    for (const result of results) expect([200, 201]).toContain(result.status)
    const ids = new Set(results.map((result) => result.body.data.id))
    expect(ids.size, 'minden hivo ugyanazt a nyitott probalkozast kapja').toBe(1)

    // Az allapot az API-n at: a vizsgalistaban egyetlen, futo probalkozas latszik.
    const listed = (await listExams(client)).body.data.find((exam) => exam.id === EXAM.id)
    expect(listed?.attempt?.state).toBe('in_progress')
    expect(listed?.attempt?.id).toBe([...ids][0])
  })

  test('vizsga beadasa tobbszor egyszerre: egyszer ertekelodik, az eredmeny stabil', async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const { client } = await premiumStudent(apiClient, admin)
    const started = await startAttempt(client, EXAM.id, 'practice')
    expect(started.status).toBe(201)
    const attemptId = started.body.data.id

    const results = await parallel(PARALLEL, () => submitAttempt(client, attemptId))

    for (const result of results) {
      expect(result.status).toBe(200)
      expect(['submitted', 'evaluated']).toContain(result.body.data.state)
    }

    const final = await getAttempt(client, attemptId)
    expect(final.body.data.state).toBe('evaluated')

    const first = await attemptResult(client, attemptId)
    expect(first.status).toBe(200)
    const second = await attemptResult(client, attemptId)
    expect(second.body.data.score).toBe(first.body.data.score)

    // Egy kesobbi beadas sem valtoztat: idempotens.
    expect((await submitAttempt(client, attemptId)).body.data.state).toBe('evaluated')
  })

  test('utolso admin: ket admin egyszerre fokozza le egymast, de legalabb egy admin marad', async ({ apiClient }) => {
    const seeded = await adminAccount(apiClient)
    const second = await premiumStudent(apiClient, seeded.client)
    expect((await seeded.client.adminChangeRole(second.user.id, 'admin')).status).toBe(200)

    // Az uj admin tokenje a szerepkor-valtas utan is ervenyes (a szerepkort a szerver elo adatbol olvassa).
    const secondAdmin = second.client
    expect((await secondAdmin.me()).body.data.role).toBe('admin')

    // Keresztben: a fixture admin a masodikat, a masodik a fixture admint probalja lefokozni, tobbszor.
    const calls = await parallel(PARALLEL, (index) =>
      index % 2 === 0 ? seeded.client.adminChangeRole(second.user.id, 'student') : secondAdmin.adminChangeRole(seeded.user.id, 'student')
    )

    // 200: lefokozta / mar le volt fokozva; 403: a lefokozott admin mar nem admin; 409: az utolso admin vedelme.
    for (const call of calls) expect([200, 403, 409]).toContain(call.status)

    const roles = await Promise.all([seeded.client.me(), secondAdmin.me()])
    const survivors = [seeded, second].filter((_, index) => roles[index]?.body.data.role === 'admin')
    expect(survivors.length, 'soha nem lehet nulla admin').toBeGreaterThanOrEqual(1)

    // A fenti allitas garantalja, hogy van tulelo; a `?? seeded` csak a tipus miatt kell.
    const survivor = survivors[0] ?? seeded
    expect(await adminUserTotal(survivor.client, { role: 'admin' })).toBeGreaterThanOrEqual(1)

    // Takaritas: a tulelo admin visszaadja a fixture admin jogat majd a masodik ujra diak.
    // Ha a fixture admin tulelte, nincs teendo (a sajat szerepkor valtoztatasat a policy tiltja).
    const restores = await Promise.all(survivors.filter((account) => account !== seeded).map((account) => account.client.adminChangeRole(seeded.user.id, 'admin')))
    for (const restore of restores) expect(restore.status).toBe(200)
    expect((await seeded.client.adminChangeRole(second.user.id, 'student')).status).toBe(200)
    expect((await seeded.client.me()).body.data.role).toBe('admin')
  })

  test('ugyanazon e-mail-cimmel egyszerre regisztralva pontosan egy fiok jon letre', async ({ apiClient }) => {
    const payload = registration()

    const results = await parallel(PARALLEL, () => apiClient.register(payload))

    expect(results.filter((result) => result.status === 201)).toHaveLength(1)
    for (const result of results.filter((entry) => entry.status !== 201)) expect(result.status).toBe(422)

    const login = await apiClient.login({ email: payload.email, password: payload.password })
    expect(login.status).toBe(200)
  })

  test('ugyanazon lecke teljesitese egyszerre: egyetlen teljesites, a haladas nem duplazodik', async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const { client } = await premiumStudent(apiClient, admin)
    const lessonId = SEEDED.typed.web.lessonId
    const before = (await progress(client)).body.data.overall.completed

    const results = await parallel(PARALLEL, () => completeLesson(client, lessonId))

    for (const result of results) expect(result.status).toBe(200)
    expect((await progress(client)).body.data.overall.completed).toBe(before + 1)
  })

  test('egyszerre erkezo helyes beadasok: pontosan egy teljesiti a leckét', async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const { client } = await premiumStudent(apiClient, admin)
    const taskId = 1

    const results = await parallel(PARALLEL, () => client.post<{ submission_id: number; lesson_completed?: boolean }>('submissions', { task_id: taskId, language: 'python', source_code: 'print(1)' }))

    for (const result of results) expect(result.status).toBe(200)
    expect(new Set(results.map((result) => result.body.submission_id)).size, 'minden beadas kulon sor').toBe(PARALLEL)
    expect(results.filter((result) => result.body.lesson_completed === true), 'a lecke egyszer teljesul').toHaveLength(1)
  })
})
