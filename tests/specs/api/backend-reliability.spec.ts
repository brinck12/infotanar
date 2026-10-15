import type { ApiClient } from '../../src/api/ApiClient'
import { Outbox } from '../../src/api/Outbox'
import { saveManualMarks, uploadFileSubmission } from '../../src/api/areas/fileTasks'
import { accountExport, completeLesson, deleteAccount, taskStatus } from '../../src/api/areas/progress'
import { DEFAULT_PASSWORD, ECHO_PROGRAM, FIXTURE_FILES, registration, SEEDED } from '../../src/data'
import { fixtureFile } from '../../src/data/files'
import { expect, test } from '../../src/fixtures'
import { rowCount, runRetentionJob } from '../../src/support/artisan'
import {
  ageSubmissions,
  auditCount,
  auditRowsOf,
  consentsOf,
  deleteWithFailingOralPurge,
  draftTrackIds,
  lessonCompletionCount,
  loginLimiterAttempts,
  practiceSubmissionIds,
  probeAuditPrune,
  plantLessonCompletion,
  probeLanguagesCache,
  redactedMetadata,
  submissionSources,
  truncatedIps,
  uncompromisedRule,
} from '../../src/support/reliability'

/**
 * Backend megbizhatosag es adatvedelem: B01 (megorzes), B04/G-08/G-09 (limitek), B05 (takaritok),
 * B07 (/languages cache), B10/B11 (piszkozat track), PRIV-3/4/10, F03/F04.
 */

const SHEET = SEEDED.typed.sheetUpload
const MANUAL_MARK = { [String(SHEET.manualItemId)]: true }
const RESET_PATH = '/jelszo-visszaallitas'
const PASSWORD_MAIL_SUBJECT = 'A jelszavad megváltozott'

async function student(apiClient: ApiClient) {
  const payload = registration()
  const account = await apiClient.signUp(payload)

  return { client: account.client, id: account.user.id, token: account.token, password: payload.password, email: payload.email }
}

test.describe('B01: a sikeres fájlbeadás megmarad a megőrzési takarításkor', () => {
  test('a feladatonkénti korlát (10) és az éves job sem törli a megoldott beadást', { tag: '@regression' }, async ({ apiClient }) => {
    const { client, id } = await student(apiClient)

    const passed = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))
    expect(passed.status).toBe(201)
    expect((await saveManualMarks(client, passed.body.data.id, MANUAL_MARK)).status).toBe(200)
    expect((await taskStatus(client, SHEET.id)).body.data.my_status).toBe('solved')

    // A korlat 10: a 11. gyenge feltoltes utan a legregebbi (a sikeres) esne ki, ha nem vedene a szabaly.
    for (let i = 0; i < 11; i++) {
      expect((await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetWrong))).status).toBe(201)
    }

    const rows = practiceSubmissionIds(id)
    expect(rows).toContain(passed.body.data.id)
    expect(rows.length).toBeLessThanOrEqual(11)
    expect((await taskStatus(client, SHEET.id)).body.data.my_status).toBe('solved')

    // Az eves job: minden sor 400 napos, a sikeres megmarad, a gyenge torlodik.
    ageSubmissions(rows, 400)
    runRetentionJob()

    expect(practiceSubmissionIds(id)).toEqual([passed.body.data.id])
    expect((await taskStatus(client, SHEET.id)).body.data.my_status).toBe('solved')
  })
})

test.describe('B10/B11: a piszkozat track tartalma nem érhető el', () => {
  test('a feladat, a videó, a futtatás, a beadás és a lecke-teljesítés 404, a nem létező azonosítóval azonosan', { tag: '@regression' }, async ({ apiClient }) => {
    const { exerciseId, lessonId } = draftTrackIds(SEEDED.draftTrackTask)
    const { client } = await student(apiClient)
    const payload = { language: 'python', source_code: ECHO_PROGRAM }

    for (const who of [apiClient, client]) {
      expect((await who.task(exerciseId)).status).toBe(404)
      expect((await who.get(`lessons/${String(lessonId)}/video`)).status).toBe(404)
    }

    expect((await apiClient.run({ task_id: exerciseId, ...payload })).status).toBe(404)
    expect((await client.submit({ task_id: exerciseId, ...payload })).status).toBe(404)
    expect((await completeLesson(client, lessonId)).status).toBe(404)

    // Ugyanaz a valasz, mint egy nem letezo azonositonal: a piszkozat-azonosito nem szivarog.
    const missing = await apiClient.run({ task_id: 999_999, ...payload })
    expect(missing.status).toBe(404)
    expect((await apiClient.run({ task_id: exerciseId, ...payload })).body).toEqual(missing.body)

    // A lista sem mutatja.
    const titles = (await client.tasks()).body.data.map((task) => task.title)
    expect(titles).not.toContain(SEEDED.draftTrackTask)
  })

  test('hiányzó vagy hibás task_id továbbra is 422', { tag: '@regression' }, async ({ apiClient }) => {
    expect((await apiClient.run({ language: 'python', source_code: 'x' } as never)).status).toBe(422)
    expect((await apiClient.run({ task_id: 'abc', language: 'python', source_code: 'x' } as never)).status).toBe(422)
  })
})

test.describe('B07: a /languages hibája nem marad egy óráig a cache-ben', () => {
  test('rövid várakozás után az újra lekérdezett lista visszajön', { tag: '@regression' }, () => {
    const probe = probeLanguagesCache(`http://127.0.0.1:${process.env.JUDGE0_MOCK_PORT ?? '2358'}`)

    expect(probe.failedCount).toBe(0)
    expect(probe.afterShortWait).toBeGreaterThan(0)
  })
})

test.describe('B04/G-08/G-09: limitek', () => {
  test('a belépés és a jelszó-visszaállítás e-mail+IP mellett IP-nkénti korlátot is kap', { tag: '@regression' }, () => {
    expect(loginLimiterAttempts('login')).toHaveLength(2)
    expect(loginLimiterAttempts('login')[0]).toBe(5)
    expect(loginLimiterAttempts('password-reset')).toHaveLength(2)
    expect(loginLimiterAttempts('password-reset')[0]).toBe(5)
  })

  test('a 429 üzenet a várakozási időt is kiírja', { tag: '@regression' }, async ({ apiClient }) => {
    const payload = registration()
    await apiClient.register(payload)

    let last = await apiClient.login({ email: payload.email, password: 'Rossz12345' })
    for (let i = 0; i < 5; i++) {
      last = await apiClient.login({ email: payload.email, password: 'Rossz12345' })
    }

    expect(last.status).toBe(429)
    expect(last.response.headers()['retry-after']).toBeTruthy()
    expect((last.body as unknown as { message: string }).message).toMatch(/Próbáld újra \d+ (másodperc|perc) múlva\./)
  })

  test('az adatexport nem osztja a jelszót ellenőrző műveletek limitjét', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)
    const statuses: number[] = []

    for (let i = 0; i < 7; i++) {
      statuses.push((await client.put('account/password', { current_password: 'rossz', password: 'Uj-Titkos123', password_confirmation: 'Uj-Titkos123' })).status)
    }
    expect(statuses).toContain(429)

    expect((await accountExport(client)).status).toBe(200)
  })
})

test.describe('PRIV-10/F03/F04: hitelesítés', () => {
  test('jelszócsere után értesítő levél megy, és audit esemény készül', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const { client, email, id, password } = await student(apiClient)
    const before = await outbox.countTo(email)

    const changed = await client.put('account/password', { current_password: password, password: 'Uj-Titkos123', password_confirmation: 'Uj-Titkos123' })

    expect(changed.status).toBe(200)
    await expect.poll(() => outbox.countTo(email)).toBe(before + 1)
    expect((await outbox.latestTo(email)).subject).toBe(PASSWORD_MAIL_SUBJECT)
    expect(auditRowsOf(id).map((row) => row.action)).toContain('account.password_changed')
  })

  test('jelszó-visszaállítás után értesítő levél és audit esemény van', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const { email, id } = await student(apiClient)
    expect((await apiClient.post('auth/forgot-password', { email })).status).toBe(202)
    const link = Outbox.linkTo(await outbox.latestTo(email), RESET_PATH)
    const before = await outbox.countTo(email)

    const reset = await apiClient.post('auth/reset-password', {
      email,
      token: link.searchParams.get('token'),
      password: 'Uj-Titkos123',
      password_confirmation: 'Uj-Titkos123',
    })

    expect(reset.status).toBe(200)
    await expect.poll(() => outbox.countTo(email)).toBe(before + 1)
    expect((await outbox.latestTo(email)).subject).toBe(PASSWORD_MAIL_SUBJECT)
    expect(auditRowsOf(id).map((row) => row.action)).toContain('auth.password_reset')
  })

  test('a belépés és a sikertelen belépés audit eseményt ír, e-mail-cím nélkül', { tag: '@regression' }, async ({ apiClient }) => {
    const { id, email, password } = await student(apiClient)
    const failedBefore = auditCount('auth.login_failed')

    expect((await apiClient.login({ email, password: 'Rossz12345' })).status).toBe(401)
    expect((await apiClient.login({ email: 'nincs-ilyen@example.test', password: 'Rossz12345' })).status).toBe(401)
    expect((await apiClient.login({ email, password })).status).toBe(200)

    expect(auditCount('auth.login_failed')).toBe(failedBefore + 2)
    const rows = auditRowsOf(id)
    expect(rows.map((row) => row.action)).toEqual(expect.arrayContaining(['auth.login_succeeded', 'auth.login_failed']))
    for (const row of rows.filter((candidate) => candidate.action.startsWith('auth.'))) {
      expect(row.metadata).toBeNull()
    }
  })

  test('a kézi pontozás audit eseményt ír', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)
    const upload = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))
    const before = auditCount('file_submission.manually_marked', upload.body.data.id)

    expect((await saveManualMarks(client, upload.body.data.id, MANUAL_MARK)).status).toBe(200)

    expect(auditCount('file_submission.manually_marked', upload.body.data.id)).toBe(before + 1)
  })

  test('a kiszivargott jelszavak ellenőrzése csak élesben aktív', { tag: '@regression' }, () => {
    expect(uncompromisedRule()).toEqual({ production: true, testing: false })
  })
})

test.describe('PRIV-3/PRIV-4/B05: adatvédelem és takarítás', () => {
  test('a hozzájárulás IP-je csonkolva tárolódik', { tag: '@regression' }, async ({ apiClient }) => {
    const { id } = await student(apiClient)

    const consents = consentsOf(id)

    expect(consents.length).toBeGreaterThan(0)
    for (const consent of consents) {
      expect(consent.ip_address).toMatch(/^(127\.0\.0\.0|::)$/)
    }
    expect(truncatedIps()).toEqual({ v4: '192.168.5.0', v6: '2001:db8:abcd::', bad: null })
  })

  test('a fiók törlése nullázza a hozzájárulás és az audit IP-jét, kitakarja a kódot és a szabad szöveget', { tag: '@regression' }, async ({ apiClient, request }) => {
    const { client, id, token, password } = await student(apiClient)
    const first = await client.submit({ task_id: await apiClient.taskIdByTitle(SEEDED.tasks.main), language: 'python', source_code: ECHO_PROGRAM })
    expect(first.status).toBe(200)
    const admin = await apiClient.login({ email: SEEDED.accounts.admin, password: DEFAULT_PASSWORD })
    const verified = await apiClient.withToken(admin.body.data.token).adminVerifyEmail(id, 'Kovács Anna, 11.b osztály')
    expect(verified.status).toBe(204)
    expect(redactedMetadata(id).length).toBeGreaterThan(0)
    expect(consentsOf(id).some((consent) => consent.ip_address !== null)).toBe(true)
    expect(auditRowsOf(id).some((row) => row.ip_address !== null)).toBe(true)

    expect(await deleteAccount(request, token, password)).toBe(204)

    for (const consent of consentsOf(id)) {
      expect(consent.ip_address).toBeNull()
      expect(consent.user_agent).toBeNull()
    }
    const audit = auditRowsOf(id)
    expect(audit.length).toBeGreaterThan(0)
    for (const row of audit) {
      expect(row.ip_address).toBeNull()
    }
    expect(redactedMetadata(id)).toEqual([{ redacted: true }])
    expect(JSON.stringify(auditRowsOf(id))).not.toContain('Kovács')
    const sources = submissionSources([first.body.submission_id])
    expect(sources).toHaveLength(1)
    expect(sources[0]?.userId).toBeNull()
    expect(sources[0]?.containsOriginal).toBe(false)
  })

  test('egy hibázó takarító nem állítja meg a törlést és a többi takarítót, a söprés pótolja', { tag: '@regression' }, async ({ apiClient }) => {
    const { id } = await student(apiClient)
    plantLessonCompletion(id, 1)
    expect(lessonCompletionCount(id)).toBe(1)

    const outcome = deleteWithFailingOralPurge(id)

    expect(outcome).toEqual({ threw: false, completionsLeft: 0, oralLeft: 1, trashed: true })

    // A napi megorzesi job soproje utolagosan elvegzi a hibazott takaritast.
    runRetentionJob()
    expect(rowCount('oral_practices', id)).toBe(0)
  })

  test('az audit:prune lenullázza a régi IP-ket, és csak beállítás esetén töröl', { tag: '@regression' }, () => {
    expect(probeAuditPrune()).toEqual({
      oldIp: null,
      recentIp: '203.0.113.7',
      oldKept: true,
      veryOldKept: true,
      veryOldKeptWithPolicy: false,
    })
  })
})
