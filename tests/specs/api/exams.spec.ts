import { adminAccount, premiumStudent, verifiedStudent } from '../../src/api/areas/accounts'
import {
  addAdminExamPart,
  adminExam,
  adminExams,
  attempt as getAttempt,
  attemptResult,
  createAdminExam,
  examDetail,
  examPayload,
  listExams,
  removeAdminExamPart,
  reorderAdminExamParts,
  startAttempt,
  submitAttempt,
  updateAdminExam,
  uploadExamZip,
  uploadPartFile,
} from '../../src/api/areas/exams'
import { fileSubmission, saveManualMarks } from '../../src/api/areas/fileTasks'
import { artisan, tinkerJson } from '../../src/support/artisan'
import { createExercise, createTestCase, deleteExercise } from '../../src/api/areas/typedTasks'
import type { ApiClient } from '../../src/api/ApiClient'
import { deleteAttachment } from '../../src/api/areas/attachments'
import type { AdminExam, ExamAttempt } from '../../src/api/types'
import { FIXTURE_FILES, SEEDED, TEST_BACKEND } from '../../src/data'
import { fixtureFile } from '../../src/data/files'
import { expect, test } from '../../src/fixtures'
import { JUDGE0_EXECUTION_CONTROL } from '../../src/mocks/judge0/controls'

const MAIN = SEEDED.exams.main
const EXPIRED = SEEDED.exams.expired
const UNPUBLISHED = SEEDED.exams.unpublished
const SHEET = SEEDED.typed.sheetUpload
const DOC = SEEDED.typed.docUpload
const WEB = SEEDED.typed.web
const SUBTASKS = SEEDED.typed.subtasks
const [FILE_PART, EDITOR_PART] = MAIN.parts

const MINUTE = 60_000

/** A hianyos vizsga-fixture ne tegye a tobbi tesztet tipus-bizonytalanna. */
function must<T>(value: T | null | undefined): T {
  if (value === undefined || value === null) throw new Error('Hianyzo fixture')
  return value
}

interface Actors {
  admin: ApiClient
  student: ApiClient
}

/** Admin es egy friss, premium hozzaferesu diak. */
async function actors(apiClient: ApiClient): Promise<Actors> {
  const admin = (await adminAccount(apiClient)).client
  return { admin, student: (await premiumStudent(apiClient, admin)).client }
}

async function start(client: ApiClient, examId: number, mode = 'exam'): Promise<ExamAttempt> {
  const started = await startAttempt(client, examId, mode)
  if (started.status !== 201 && started.status !== 200) throw new Error(`A probalkozas inditasa sikertelen (${String(started.status)})`)
  return started.body.data
}

async function uploadOk(client: ApiClient, attemptId: number, file: string = FIXTURE_FILES.sheetOk): Promise<void> {
  const uploaded = await uploadPartFile(client, attemptId, FILE_PART.id, fixtureFile(file))
  if (uploaded.status !== 200) throw new Error(`A feltoltes sikertelen (${String(uploaded.status)}): ${JSON.stringify(uploaded.errorBody)}`)
}

/** A szerkesztos reszhez (8. feladat) a reszfeladatos "felig jo" megoldas beadasa. */
async function submitPartialCode(client: ApiClient): Promise<void> {
  const submitted = await client.submit({ task_id: EDITOR_PART.exerciseId, language: SUBTASKS.language, source_code: `print("${JUDGE0_EXECUTION_CONTROL.subtasks}")` })
  if (submitted.status !== 200) throw new Error(`A kodbeadas sikertelen (${String(submitted.status)})`)
}

test.describe('Vizsgák: lista és részletek', () => {
  test('a lista nyilvános: a publikált vizsgák, nem publikus nélkül, a legújabb időszak elöl', { tag: '@smoke' }, async ({ apiClient }) => {
    const list = await listExams(apiClient)

    expect(list.status).toBe(200)
    const ids = list.body.data.map((exam) => exam.id)
    expect(ids).toContain(MAIN.id)
    expect(ids).toContain(EXPIRED.id)
    expect(ids).not.toContain(UNPUBLISHED.id)
    expect(ids.indexOf(EXPIRED.id)).toBeLessThan(ids.indexOf(MAIN.id))

    const main = list.body.data.find((exam) => exam.id === MAIN.id)
    expect(main).toMatchObject({ session: MAIN.session, title: MAIN.title, level: 'kozep', minutes: MAIN.minutes, points: MAIN.points, attempt: null })
    expect(main?.parts).toEqual(MAIN.parts.map((part) => ({ id: part.id, order: part.order, key: part.key, name: part.name, points: part.points, minutes: part.minutes })))
    expect(list.body.data.every((exam) => exam.attempt === null)).toBe(true)
  })

  test('a részletek vendégnek 401, ismeretlen vizsgára 404', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)

    expect((await examDetail(apiClient, MAIN.id)).status).toBe(401)
    expect((await examDetail(student, 999999)).status).toBe(404)
  })

  test('előfizetés nélkül csak a szerkezet látszik: üres szöveg, lépések, források, nincs zip', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const unsubscribed = (await verifiedStudent(apiClient, admin)).client

    const detail = await examDetail(unsubscribed, MAIN.id)

    expect(detail.status).toBe(200)
    expect(detail.body.data.parts.map((part) => part.name)).toEqual(MAIN.parts.map((part) => part.name))
    for (const part of detail.body.data.parts) {
      expect(part).toMatchObject({ description: '', steps: [], sources: [], deliverable: null, accepted_extensions: [], software: null })
    }
    expect(detail.body.data.source_zip).toBeNull()
  })

  test('előfizetett diák a teljes tartalmat látja, exercise_id csak a szerkesztős résznél van', { tag: '@smoke' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)

    const detail = await examDetail(student, MAIN.id)

    expect(detail.status).toBe(200)
    const [first, second] = detail.body.data.parts
    expect(first).toMatchObject({
      id: FILE_PART.id,
      exercise_id: null,
      steps: SHEET.spec.steps,
      deliverable: SHEET.spec.deliverable,
      accepted_extensions: SHEET.spec.accepted_extensions,
      software: 'Excel',
    })
    expect(first?.description).not.toBe('')
    expect(second).toMatchObject({ id: EDITOR_PART.id, exercise_id: EDITOR_PART.exerciseId, steps: [], accepted_extensions: [] })
    expect(second?.sources.map((source) => source.name)).toEqual([SUBTASKS.source.name])
    expect(detail.body.data.attempt).toBeNull()
  })

  test('a forrásfájlok és a forrás-zip aláírt URL-en letölthetők', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const detail = (await examDetail(student, MAIN.id)).body.data

    const zip = detail.source_zip
    expect(zip?.name).toBe(MAIN.sourceZip.name)
    const downloaded = await apiClient.getBinary(must(zip).url)
    expect(downloaded.status).toBe(200)

    const source = must(detail.parts[1]?.sources[0])
    const data = await apiClient.getBinary(source.url)
    expect(data.status).toBe(200)
    expect(data.body.toString('utf8')).toBe(SUBTASKS.source.content)
  })

  test('nem publikus vizsga diáknak 404, adminnak 200', { tag: '@regression' }, async ({ apiClient }) => {
    const { admin, student } = await actors(apiClient)

    expect((await examDetail(student, UNPUBLISHED.id)).status).toBe(404)
    const asAdmin = await examDetail(admin, UNPUBLISHED.id)
    expect(asAdmin.status).toBe(200)
    expect(asAdmin.body.data.id).toBe(UNPUBLISHED.id)
  })
})

test.describe('Vizsgák: próbálkozás indítása', () => {
  test('vendég 401, előfizetés nélkül 403 subscription_required, nem publikus vizsgán 404', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const unsubscribed = (await verifiedStudent(apiClient, admin)).client
    const { student } = await actors(apiClient)

    expect((await startAttempt(apiClient, MAIN.id, 'exam')).status).toBe(401)
    const locked = await startAttempt(unsubscribed, MAIN.id, 'exam')
    expect(locked.status).toBe(403)
    expect(locked.errorBody).toMatchObject({ reason: 'subscription_required' })
    expect((await startAttempt(student, UNPUBLISHED.id, 'exam')).status).toBe(404)
  })

  test('vizsgahelyzetben a határidő a kezdés + a vizsga hossza, a válasz szervere idejét is tartalmazza', { tag: '@smoke' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)

    const started = await startAttempt(student, MAIN.id, 'exam')

    expect(started.status).toBe(201)
    const created = started.body.data
    expect(created).toMatchObject({ exam_id: MAIN.id, mode: 'exam', state: 'in_progress', submissions: [] })
    expect(Date.parse(must(created.deadline)) - Date.parse(created.started_at)).toBe(MAIN.minutes * MINUTE)
    expect(Number.isNaN(Date.parse(created.server_time))).toBe(false)
  })

  test('a második indítás a nyitott próbálkozást adja vissza (200), a kért módtól függetlenül', { tag: '@smoke' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const first = await startAttempt(student, MAIN.id, 'exam')

    const again = await startAttempt(student, MAIN.id, 'exam')
    const other = await startAttempt(student, MAIN.id, 'practice')

    expect(first.status).toBe(201)
    expect(again.status).toBe(200)
    expect(again.body.data).toMatchObject({ id: first.body.data.id, mode: 'exam' })
    expect(other.status).toBe(200)
    expect(other.body.data.id).toBe(first.body.data.id)
  })

  test('két egyszerre érkező indítás egyetlen próbálkozást hoz létre', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)

    const [a, b] = await Promise.all([startAttempt(student, MAIN.id, 'exam'), startAttempt(student, MAIN.id, 'exam')])

    expect(a.body.data.id).toBe(b.body.data.id)
    expect([a.status, b.status].sort()).toEqual([200, 201])
  })

  test('gyakorláskor nincs határidő; érvénytelen vagy hiányzó mód 422', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const { student: other } = await actors(apiClient)

    const practice = await startAttempt(student, MAIN.id, 'practice')
    expect(practice.status).toBe(201)
    expect(practice.body.data).toMatchObject({ mode: 'practice', deadline: null })

    const invalid = await startAttempt(other, MAIN.id, 'bármi')
    expect(invalid.status).toBe(422)
    expect(invalid.errorBody.errors).toHaveProperty('mode')
    expect((await other.post(`exams/${String(MAIN.id)}/attempts`, {})).status).toBe(422)
  })

  test('a vizsgán, ahol nincs időzített mód, a vizsgahelyzet 422, a gyakorlás megy', { tag: '@regression' }, async ({ apiClient }) => {
    const { admin, student } = await actors(apiClient)
    const exam = await publishedExam(admin, { timed_mode: false })

    const timed = await startAttempt(student, exam.id, 'exam')
    expect(timed.status).toBe(422)
    expect(timed.errorBody.message).toBe('Ehhez a feladatsorhoz nincs vizsgahelyzet, válaszd a gyakorlást.')

    expect((await startAttempt(student, exam.id, 'practice')).status).toBe(201)

    await unpublish(admin, exam)
  })
})

test.describe('Vizsgák: feltöltés, beadás, eredmény', () => {
  test('a fájlos rész feltöltése megjelenik a próbálkozásban és a listán; az újabb feltöltés cserél', { tag: '@smoke' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const created = await start(student, MAIN.id)

    const first = await uploadPartFile(student, created.id, FILE_PART.id, fixtureFile(FIXTURE_FILES.sheetWrong))
    const second = await uploadPartFile(student, created.id, FILE_PART.id, fixtureFile(FIXTURE_FILES.sheetOk))

    expect(first.status).toBe(200)
    expect(first.body.data.submissions).toMatchObject([{ part_id: FILE_PART.id, file_name: FIXTURE_FILES.sheetWrong }])
    expect(second.status).toBe(200)
    expect(second.body.data.submissions).toHaveLength(1)
    expect(second.body.data.submissions[0]).toMatchObject({ part_id: FILE_PART.id, file_name: FIXTURE_FILES.sheetOk })
    expect(second.body.data.server_time).toBeTruthy()

    const list = (await listExams(student)).body.data.find((exam) => exam.id === MAIN.id)
    expect(list?.attempt).toEqual({ id: created.id, mode: 'exam', state: 'in_progress', score: null, max_score: MAIN.points, completed_parts: [FILE_PART.order] })
    expect((await examDetail(student, MAIN.id)).body.data.attempt?.id).toBe(created.id)
  })

  test('a szerkesztős részbe nem tölthető fel fájl, rossz kiterjesztés, hiányzó fájl és idegen rész elutasítva', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const created = await start(student, MAIN.id)

    const editor = await uploadPartFile(student, created.id, EDITOR_PART.id, fixtureFile(FIXTURE_FILES.sheetOk))
    expect(editor.status).toBe(422)
    expect(editor.errorBody.message).toBe('Ezt a részt a beépített szerkesztőben oldod meg.')

    expect((await uploadPartFile(student, created.id, FILE_PART.id, fixtureFile(FIXTURE_FILES.docA4))).status).toBe(422)
    expect((await uploadPartFile(student, created.id, FILE_PART.id, fixtureFile(FIXTURE_FILES.macro))).status).toBe(422)
    expect((await uploadPartFile(student, created.id, FILE_PART.id)).status).toBe(422)

    // A lejart vizsga egyetlen resze nem ehhez a vizsgahoz tartozik; ismeretlen resz sem.
    const foreignPart = must(EXPIRED.parts[0]).id
    expect((await uploadPartFile(student, created.id, foreignPart, fixtureFile(FIXTURE_FILES.sheetOk))).status).toBe(404)
    expect((await uploadPartFile(student, created.id, 999999, fixtureFile(FIXTURE_FILES.sheetOk))).status).toBe(404)
    expect((await getAttempt(student, created.id)).body.data.submissions).toEqual([])
  })

  test('idegen próbálkozás minden végponton 404, vendég 401', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const { student: intruder } = await actors(apiClient)
    const created = await start(student, MAIN.id)

    expect((await getAttempt(intruder, created.id)).status).toBe(404)
    expect((await uploadPartFile(intruder, created.id, FILE_PART.id, fixtureFile(FIXTURE_FILES.sheetOk))).status).toBe(404)
    expect((await uploadPartFile(intruder, created.id, FILE_PART.id)).status).toBe(404)
    expect((await submitAttempt(intruder, created.id)).status).toBe(404)
    expect((await attemptResult(intruder, created.id)).status).toBe(404)
    expect((await getAttempt(intruder, 999999)).status).toBe(404)

    expect((await getAttempt(apiClient, created.id)).status).toBe(401)
    expect((await submitAttempt(apiClient, created.id)).status).toBe(401)
    // A gazda próbálkozása érintetlen.
    expect((await getAttempt(student, created.id)).body.data.state).toBe('in_progress')
  })

  test('az eredmény beadás előtt 409; beadás után a pontok átváltva, a kézi pont még függ', { tag: '@smoke' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const created = await start(student, MAIN.id)
    await uploadOk(student, created.id)

    const early = await attemptResult(student, created.id)
    expect(early.status).toBe(409)
    expect(early.errorBody.message).toBe('Az eredmény még készül. Próbáld újra egy pillanat múlva.')

    const submitted = await submitAttempt(student, created.id)
    expect(submitted.status).toBe(200)
    expect(submitted.body.data).toMatchObject({ id: created.id, state: 'evaluated' })

    const result = await attemptResult(student, created.id)
    expect(result.status).toBe(200)
    const body = result.body.data
    expect(body).toMatchObject({ attempt_id: created.id, score: SHEET.expected.ok.score, max_score: MAIN.points, pending_manual_points: 1 })
    expect(body.parts).toHaveLength(2)
    expect(body.parts[0]).toMatchObject({ part_id: FILE_PART.id, score: 9, max_score: FILE_PART.points })
    expect(body.parts[0]?.file_submission_id).toEqual(expect.any(Number))
    expect(body.parts[1]).toEqual({
      part_id: EDITOR_PART.id,
      score: 0,
      max_score: EDITOR_PART.points,
      summary: 'Nem adtál be megoldást ebben a részben.',
      file_submission_id: null,
    })
    expect(body.exam).toMatchObject({ id: MAIN.id, attempt: { id: created.id, state: 'evaluated', score: 9, max_score: MAIN.points, completed_parts: [FILE_PART.order] } })
    expect(body.review.length).toBeGreaterThan(0)
    expect(body.review.length).toBeLessThanOrEqual(3)
    expect(body.review[0]).toMatchObject({ lesson_id: expect.any(Number), title: expect.any(String), track: expect.any(String) })
  })

  test('a beadás idempotens, beadás után a feltöltés 409', { tag: '@smoke' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const created = await start(student, MAIN.id)
    await uploadOk(student, created.id)

    const first = await submitAttempt(student, created.id)
    const second = await submitAttempt(student, created.id)
    const late = await uploadPartFile(student, created.id, FILE_PART.id, fixtureFile(FIXTURE_FILES.sheetWrong))

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(Number.isNaN(Date.parse(first.body.data.server_time))).toBe(false)
    expect(second.body.data).toEqual({ ...first.body.data, server_time: second.body.data.server_time })
    expect(late.status).toBe(409)
    expect(late.errorBody.message).toBe('A feladatsor már be van adva, a megoldások nem módosíthatók.')
    expect((await getAttempt(student, created.id)).body.data.submissions).toMatchObject([{ file_name: FIXTURE_FILES.sheetOk }])
  })

  test('a fájlos rész értékelőlapja megnyitható, a kézi pont jelölése az eredményt frissíti', { tag: '@smoke' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const { student: other } = await actors(apiClient)
    const created = await start(student, MAIN.id)
    await uploadOk(student, created.id)

    await submitAttempt(student, created.id)
    const before = (await attemptResult(student, created.id)).body.data
    const submissionId = must(before.parts[0]?.file_submission_id ?? undefined)

    const sheet = await fileSubmission(student, submissionId)
    expect(sheet.status).toBe(200)
    expect(sheet.body.data).toMatchObject({ id: submissionId, exercise_id: SHEET.id, status: 'evaluated', score: SHEET.expected.ok.score })
    expect((await fileSubmission(other, submissionId)).status).toBe(404)

    const marked = await saveManualMarks(student, submissionId, { [String(SHEET.manualItemId)]: true })
    expect(marked.status).toBe(200)

    const after = (await attemptResult(student, created.id)).body.data
    expect(after).toMatchObject({ score: 10, pending_manual_points: 0 })
    expect(after.parts[0]).toMatchObject({ score: 10, file_submission_id: submissionId })
    expect(after.parts[1]).toMatchObject({ score: 0 })
    expect((await listExams(student)).body.data.find((exam) => exam.id === MAIN.id)?.attempt?.score).toBe(10)
  })

  test('a szerkesztős rész a legjobb kódbeadásból pontozódik, és a próbálkozásban megjelenik', { tag: '@smoke' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const created = await start(student, MAIN.id)

    await submitPartialCode(student)

    const open = (await getAttempt(student, created.id)).body.data
    expect(open.submissions).toMatchObject([{ part_id: EDITOR_PART.id, file_name: 'megoldas.py' }])

    await submitAttempt(student, created.id)
    const result = (await attemptResult(student, created.id)).body.data

    // 2 pont az 5-ből (az 1. részfeladat): floor(2 * 10 / 5) = 4.
    expect(result.parts[1]).toEqual({
      part_id: EDITOR_PART.id,
      score: 4,
      max_score: EDITOR_PART.points,
      summary: `A(z) ${String(must(SUBTASKS.subtasks[1]).number)}. részfeladat nem adott pontot: ${must(SUBTASKS.subtasks[1]).label}.`,
      file_submission_id: null,
    })
    expect(result.parts[0]).toMatchObject({ score: 0, summary: 'Ebben a részben nem adtál be fájlt.' })
    expect(result.score).toBe(4)
    expect(result.pending_manual_points).toBe(0)
  })

  test('a gyakorló próbálkozást csak a diák adja be; a beadás előtti kódbeadás nem számít másik próbálkozásba', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    // A kódbeadás a próbálkozás kezdete elött történt: nem tartozik hozzá.
    await submitPartialCode(student)
    // Az idobelyegek masodperc pontossagu: az indulas a kodbeadas utani masodpercre essen.
    const submittedSecond = Math.floor(Date.now() / 1000)
    await expect.poll(() => Math.floor(Date.now() / 1000), { intervals: [100] }).toBeGreaterThan(submittedSecond)
    const created = await start(student, MAIN.id, 'practice')

    const open = (await getAttempt(student, created.id)).body.data
    expect(Number.isNaN(Date.parse(open.server_time))).toBe(false)
    expect(open).toMatchObject({ mode: 'practice', state: 'in_progress', deadline: null, submissions: [] })

    await submitAttempt(student, created.id)
    expect((await attemptResult(student, created.id)).body.data.parts[1]).toMatchObject({ score: 0 })
  })

  test('a lejárt próbálkozást a lekérés lustán beadja és értékeli; a feltöltés 409', { tag: '@smoke' }, async ({ apiClient }) => {
    expect(TEST_BACKEND.examGraceSeconds).toBe(0)
    const { student } = await actors(apiClient)
    const part = must(EXPIRED.parts[0])

    const started = await start(student, EXPIRED.id)
    expect(started.state).toBe('in_progress')
    expect(started.deadline).toBe(started.started_at)

    const read = await getAttempt(student, started.id)
    expect(read.status).toBe(200)
    expect(read.body.data.state).toBe('evaluated')

    const upload = await uploadPartFile(student, started.id, part.id, fixtureFile(FIXTURE_FILES.sheetOk))
    expect(upload.status).toBe(409)

    const result = await attemptResult(student, started.id)
    expect(result.status).toBe(200)
    expect(result.body.data).toMatchObject({ score: 0, max_score: part.points })

    // A lezárt próbálkozás helyére új indítható.
    const restarted = await startAttempt(student, EXPIRED.id, 'exam')
    expect(restarted.status).toBe(201)
    expect(restarted.body.data.id).not.toBe(started.id)
  })

  test('a lejárt vizsgán a feltöltés a lekérés nélkül is zárt, és a beadás értékel', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const part = must(EXPIRED.parts[0])
    const started = await start(student, EXPIRED.id)

    const upload = await uploadPartFile(student, started.id, part.id, fixtureFile(FIXTURE_FILES.sheetOk))

    expect(upload.status).toBe(409)
    expect((await getAttempt(student, started.id)).body.data.state).toBe('evaluated')
    expect((await submitAttempt(student, started.id)).body.data.state).toBe('evaluated')
  })
})

const JOB = ['App', 'Jobs', 'CloseExpiredExamAttempts'].join('\\')
const CACHE = ['Illuminate', 'Support', 'Facades', 'Cache'].join('\\')
const DB = ['Illuminate', 'Support', 'Facades', 'DB'].join('\\')
const ATTEMPT = ['App', 'Models', 'ExamAttempt'].join('\\')

function holdGates(): void {
  tinkerJson(`foreach ([0, 1, 2, 3] as $i) { ${CACHE}::lock('filetasks.eval.' . $i, 120)->get(); } return true;`)
}

function releaseGates(): void {
  tinkerJson(`foreach ([0, 1, 2, 3] as $i) { ${CACHE}::lock('filetasks.eval.' . $i)->forceRelease(); } return true;`)
}

/** A job `times`-szor lefut; a feladott probalkozasok azonositoit adja vissza. */
function runJob(times: number): number[] {
  return tinkerJson(`for ($i = 0; $i < ${String(times)}; $i++) { app()->call([new ${JOB}, 'handle']); } return ${JOB}::gaveUp();`) as number[]
}

function backdateAndRunJob(attemptId: number, times: number): number[] {
  tinkerJson(`${ATTEMPT}::query()->whereKey(${String(attemptId)})->update(['submitted_at' => now()->subMinutes(2)]); return true;`)
  return runJob(times)
}

function gaveUpIds(): number[] {
  return tinkerJson(`return ${JOB}::gaveUp();`) as number[]
}

test.describe('Vizsgák: ertekelés foglalt értékelő mellett', () => {
  test('ha minden értékelő hely foglalt, a beadás után az eredmény 409, és a job kész eredményt hoz', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const created = await start(student, MAIN.id)
    await uploadOk(student, created.id)

    tinkerJson(`foreach ([0, 1, 2, 3] as $i) { ${CACHE}::lock('filetasks.eval.' . $i, 120)->get(); } return true;`)
    try {
      const submitted = await submitAttempt(student, created.id)
      expect(submitted.status).toBe(200)
      expect(submitted.body.data.state).toBe('submitted')
      expect((await attemptResult(student, created.id)).status).toBe(409)
      expect((await getAttempt(student, created.id)).body.data.state).toBe('submitted')
      // A masodik beadas nem ertekel ujra, es nem valtoztat.
      expect((await submitAttempt(student, created.id)).body.data.state).toBe('submitted')
    } finally {
      tinkerJson(`foreach ([0, 1, 2, 3] as $i) { ${CACHE}::lock('filetasks.eval.' . $i)->forceRelease(); } return true;`)
    }

    tinkerJson(`App\\Models\\ExamAttempt::query()->whereKey(${String(created.id)})->update(['submitted_at' => now()->subMinutes(2)]); app()->call([new App\\Jobs\\CloseExpiredExamAttempts, 'handle']); return true;`)

    expect((await getAttempt(student, created.id)).body.data.state).toBe('evaluated')
    expect((await attemptResult(student, created.id)).body.data).toMatchObject({ score: SHEET.expected.ok.score })
  })

  test('a foglalt értékelő nem számít a job újrapróbálási korlátjába', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const created = await start(student, MAIN.id)
    await uploadOk(student, created.id)

    holdGates()
    try {
      await submitAttempt(student, created.id)
      const gaveUp = backdateAndRunJob(created.id, 7)
      expect(gaveUp).not.toContain(created.id)
    } finally {
      releaseGates()
    }

    runJob(1)
    expect((await getAttempt(student, created.id)).body.data.state).toBe('evaluated')
  })

  test('az ismételten hibázó értékelés a korlátnál feladódik, és kézzel (exams:evaluate) pótolható', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const created = await start(student, MAIN.id)
    await uploadOk(student, created.id)

    tinkerJson(`${DB}::unprepared('CREATE TRIGGER pw_fail_eval BEFORE UPDATE OF state ON exam_attempts WHEN NEW.state = char(101,118,97,108,117,97,116,101,100) BEGIN SELECT abs(-9223372036854775807 - 1); END'); return true;`)
    try {
      expect((await submitAttempt(student, created.id)).body.data.state).toBe('submitted')
      expect(backdateAndRunJob(created.id, 5)).toContain(created.id)
    } finally {
      tinkerJson(`${DB}::unprepared('DROP TRIGGER IF EXISTS pw_fail_eval'); return true;`)
    }

    // A hiba megszűnt, de a feladott próbálkozást a job már nem veszi fel.
    runJob(1)
    expect((await getAttempt(student, created.id)).body.data.state).toBe('submitted')

    expect(artisan(['exams:evaluate', String(created.id)])).toContain('Kiértékelve')
    expect((await getAttempt(student, created.id)).body.data.state).toBe('evaluated')
    expect(gaveUpIds()).not.toContain(created.id)
  })

  test('fájl nélküli (csak szerkesztős) beadás nem foglal értékelő helyet', { tag: '@regression' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)
    const created = await start(student, MAIN.id)
    await submitPartialCode(student)

    tinkerJson(`foreach ([0, 1, 2, 3] as $i) { ${CACHE}::lock('filetasks.eval.' . $i, 120)->get(); } return true;`)
    try {
      expect((await submitAttempt(student, created.id)).body.data.state).toBe('evaluated')
    } finally {
      tinkerJson(`foreach ([0, 1, 2, 3] as $i) { ${CACHE}::lock('filetasks.eval.' . $i)->forceRelease(); } return true;`)
    }
  })
})

/** Egy 10 pontos, az 5. feladatra épülő, kész értékelőlapú vizsga közzétéve. */
async function publishedExam(admin: ApiClient, overrides: Record<string, unknown> = {}): Promise<AdminExam> {
  const created = await createAdminExam(admin, examPayload(overrides))
  if (created.status !== 201) throw new Error(`A vizsga letrehozasa sikertelen (${String(created.status)})`)
  const withPart = await addAdminExamPart(admin, created.body.data.id, { key: 'tablazat', name: 'Táblázatkezelés', exercise_id: SHEET.id, points: 10, minutes: 15 })
  if (withPart.status !== 201) throw new Error(`A resz hozzaadasa sikertelen (${String(withPart.status)})`)
  const published = await updateAdminExam(admin, created.body.data.id, examPayload({ ...overrides, is_published: true }))
  if (published.status !== 200) throw new Error(`A kozzetetel sikertelen (${String(published.status)}): ${JSON.stringify(published.errorBody)}`)
  return published.body.data
}

/** A tesztek a vizsgalistat nem szennyezik: a kozzetett vizsgat visszavonjuk. */
async function unpublish(admin: ApiClient, exam: AdminExam): Promise<void> {
  const { id, title, level, minutes, points, timed_mode: timedMode } = exam
  const response = await updateAdminExam(admin, id, { title, level, minutes, points, timed_mode: timedMode, is_published: false })
  if (response.status !== 200) throw new Error(`A visszavonas sikertelen (${String(response.status)})`)
}

test.describe('Vizsgaszerkesztő: hozzáférés', () => {
  test('vendég 401, diák 403', { tag: '@smoke' }, async ({ apiClient }) => {
    const { student } = await actors(apiClient)

    for (const [client, expected] of [[apiClient, 401], [student, 403]] as const) {
      expect((await adminExams(client)).status).toBe(expected)
      expect((await createAdminExam(client, examPayload())).status).toBe(expected)
      expect((await adminExam(client, MAIN.id)).status).toBe(expected)
      expect((await updateAdminExam(client, MAIN.id, examPayload())).status).toBe(expected)
      expect((await addAdminExamPart(client, MAIN.id, { key: 'tablazat', name: 'x', exercise_id: null, points: 1, minutes: 1 })).status).toBe(expected)
      expect((await removeAdminExamPart(client, FILE_PART.id)).status).toBe(expected)
      expect((await reorderAdminExamParts(client, MAIN.id, [1, 2])).status).toBe(expected)
      expect((await uploadExamZip(client, MAIN.id, fixtureFile(FIXTURE_FILES.sourceZip))).status).toBe(expected)
    }
  })
})

test.describe('Vizsgaszerkesztő: vizsga és részek', () => {
  test('a fixture vizsga szerkesztői alakja: részek, értékelőlap állapot, forrás-zip azonosítóval', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client

    const exam = await adminExam(admin, MAIN.id)

    expect(exam.status).toBe(200)
    expect(exam.body.data).toMatchObject({ id: MAIN.id, session: MAIN.session, title: MAIN.title, level: 'kozep', minutes: MAIN.minutes, points: MAIN.points, is_published: true, timed_mode: true })
    expect(exam.body.data.parts).toEqual([
      { id: FILE_PART.id, order: 1, key: 'tablazat', name: FILE_PART.name, exercise_id: SHEET.id, exercise_title: SHEET.title, points: 10, minutes: 15, rubric_status: 'complete', missing_points: 0 },
      { id: EDITOR_PART.id, order: 2, key: 'programozas', name: EDITOR_PART.name, exercise_id: EDITOR_PART.exerciseId, exercise_title: SUBTASKS.title, points: 10, minutes: 15, rubric_status: 'tests', missing_points: 0 },
    ])
    expect(exam.body.data.files).toMatchObject([{ id: MAIN.sourceZip.attachmentId, name: MAIN.sourceZip.name }])
    expect(exam.body.data.files[0]?.url).toContain('attachments/')

    const list = await adminExams(admin)
    expect(list.status).toBe(200)
    expect(list.body.data.map((item) => item.id)).toEqual(expect.arrayContaining([MAIN.id, EXPIRED.id, UNPUBLISHED.id]))
    expect((await adminExam(admin, 999999)).status).toBe(404)
  })

  test('létrehozás: alapértelmezett időszak; érvénytelen szint, hossz, pont és időszak 422; közzétéve nem hozható létre', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client

    const created = await createAdminExam(admin, examPayload())
    expect(created.status).toBe(201)
    expect(created.body.data).toMatchObject({ title: 'PW szerkesztett vizsga', level: 'kozep', minutes: 30, points: 10, is_published: false, timed_mode: true, parts: [], files: [] })
    expect(created.body.data.session).toMatch(/^\d{4}-(05|10)$/)

    const explicit = await createAdminExam(admin, examPayload({ session: '2025-10' }))
    expect(explicit.body.data.session).toBe('2025-10')

    for (const [field, value] of [['level', 'haladó'], ['minutes', 0], ['minutes', 601], ['points', 0], ['points', 301], ['title', ''], ['session', '2026-07'], ['is_published', 'talán']] as const) {
      const response = await createAdminExam(admin, examPayload({ [field]: value }))
      expect(response.status, `${field}=${String(value)}`).toBe(422)
      expect(response.errorBody.errors).toHaveProperty(field)
    }

    const published = await createAdminExam(admin, examPayload({ is_published: true }))
    expect(published.status).toBe(422)
    expect(published.errorBody.errors).toHaveProperty('is_published')
  })

  test('részek: hozzáadás az egész vizsgát adja, rossz kulcs és feladatfajta 422, sorrend és törlés', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const exam = (await createAdminExam(admin, examPayload())).body.data

    const first = await addAdminExamPart(admin, exam.id, { key: 'tablazat', name: 'Táblázat', exercise_id: SHEET.id, points: 10, minutes: 20 })
    expect(first.status).toBe(201)
    expect(first.body.data.id).toBe(exam.id)
    expect(first.body.data.parts).toMatchObject([{ order: 1, key: 'tablazat', exercise_id: SHEET.id, rubric_status: 'complete', missing_points: 0 }])

    const second = await addAdminExamPart(admin, exam.id, { key: 'dokumentum', name: 'Szöveg', exercise_id: DOC.id, points: 10, minutes: 20 })
    expect(second.body.data.parts[1]).toMatchObject({ order: 2, exercise_id: DOC.id, exercise_title: DOC.title, rubric_status: 'incomplete', missing_points: 8 })

    const third = await addAdminExamPart(admin, exam.id, { key: 'szoveg', name: 'Üres', exercise_id: null, points: 5, minutes: 0 })
    expect(third.body.data.parts[2]).toMatchObject({ order: 3, exercise_id: null, exercise_title: null, rubric_status: 'incomplete', missing_points: 5 })

    const badKey = await addAdminExamPart(admin, exam.id, { key: 'nincs', name: 'x', exercise_id: null, points: 1, minutes: 1 })
    expect(badKey.status).toBe(422)
    expect(badKey.errorBody.errors).toHaveProperty('key')
    const badKind = await addAdminExamPart(admin, exam.id, { key: 'szoveg', name: 'x', exercise_id: WEB.id, points: 1, minutes: 1 })
    expect(badKind.status).toBe(422)
    expect(badKind.errorBody.errors).toHaveProperty('exercise_id')
    expect((await addAdminExamPart(admin, exam.id, { key: 'szoveg', name: 'x', exercise_id: 999999, points: 1, minutes: 1 })).status).toBe(422)
    expect((await addAdminExamPart(admin, exam.id, { key: 'szoveg', name: 'x', exercise_id: null, points: 301, minutes: 1 })).status).toBe(422)

    const ids = third.body.data.parts.map((part) => part.id)
    const [a, b, c] = ids
    expect((await reorderAdminExamParts(admin, exam.id, [c, a, b])).status).toBe(204)
    expect((await adminExam(admin, exam.id)).body.data.parts.map((part) => [part.id, part.order])).toEqual([[c, 1], [a, 2], [b, 3]])
    expect((await reorderAdminExamParts(admin, exam.id, [a, b])).status).toBe(422)
    expect((await reorderAdminExamParts(admin, exam.id, [a, a, b, c])).status).toBe(422)

    expect((await removeAdminExamPart(admin, must(a))).status).toBe(204)
    expect((await adminExam(admin, exam.id)).body.data.parts.map((part) => [part.id, part.order])).toEqual([[c, 1], [b, 2]])
    expect((await removeAdminExamPart(admin, must(a))).status).toBe(404)
  })

  test('közzétett vizsgából nem törölhető rész (422), a visszavonás után igen', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const exam = await publishedExam(admin)
    const partId = must(exam.parts[0]).id

    const refused = await removeAdminExamPart(admin, partId)
    expect(refused.status).toBe(422)
    expect(refused.errorBody.message).toBe('Közzétett vizsgából nem törölhető rész. Előbb vond vissza a közzétételt.')
    expect((await adminExam(admin, exam.id)).body.data.parts).toHaveLength(1)

    await unpublish(admin, exam)
    expect((await removeAdminExamPart(admin, partId)).status).toBe(204)
  })

  test('olyan vizsga részét, amelyen már van próbálkozás, nem lehet törölni (409)', { tag: '@regression' }, async ({ apiClient }) => {
    const { admin, student } = await actors(apiClient)
    await start(student, MAIN.id)

    const refused = await removeAdminExamPart(admin, FILE_PART.id)

    expect(refused.status).toBe(409)
    expect(refused.errorBody.message).toContain('diákok már dolgoztak vele')
    expect((await adminExam(admin, MAIN.id)).body.data.parts).toHaveLength(2)
  })

  test('közzététel: részek nélkül, hiányos értékelőlappal, nem publikált szerkesztős feladattal és pontösszeg-eltéréssel tiltott', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const exam = (await createAdminExam(admin, examPayload())).body.data
    const publish = (overrides: Record<string, unknown> = {}) => updateAdminExam(admin, exam.id, examPayload({ is_published: true, ...overrides }))

    const empty = await publish()
    expect(empty.status).toBe(422)
    expect(empty.errorBody.errors).toHaveProperty('is_published')
    expect(empty.errorBody.errors.is_published?.[0]).toBe('A vizsgának legalább egy részt tartalmaznia kell.')

    const sheetPart = (await addAdminExamPart(admin, exam.id, { key: 'tablazat', name: 'Táblázat', exercise_id: SHEET.id, points: 10, minutes: 15 })).body.data.parts[0]
    const docPart = (await addAdminExamPart(admin, exam.id, { key: 'dokumentum', name: 'Szöveg', exercise_id: DOC.id, points: 10, minutes: 15 })).body.data.parts[1]
    expect((await publish({ points: 20 })).errorBody.errors.is_published?.[0]).toBe('A(z) 2. rész értékelőlapja hiányos.')
    await removeAdminExamPart(admin, must(docPart).id)

    const draft = await createExercise(admin, {
      lesson_id: SHEET.lessonId,
      title: 'PW WP6: ideiglenes szerkesztős feladat',
      description: 'Playwright API teszt: a teszt végén törlődik.',
      level: 'kozep',
      difficulty: 1,
      kind: 'code',
      allowed_languages: ['python'],
    })
    expect(draft.status).toBe(201)
    const draftId = draft.body.data.id
    try {
      await createTestCase(admin, draftId, { stdin: '', expected_stdout: '1\n', is_hidden: false })
      const editorPart = (await addAdminExamPart(admin, exam.id, { key: 'programozas', name: 'Kód', exercise_id: draftId, points: 10, minutes: 15 })).body.data.parts[1]
      expect(editorPart).toMatchObject({ rubric_status: 'tests' })
      expect((await publish({ points: 20 })).errorBody.errors.is_published?.[0]).toBe('A(z) 2. rész feladata nincs publikálva.')
      await removeAdminExamPart(admin, must(editorPart).id)
    } finally {
      await deleteExercise(admin, draftId)
    }

    const mismatch = await publish({ points: 25 })
    expect(mismatch.status).toBe(422)
    expect(mismatch.errorBody.errors.is_published?.[0]).toBe('A részek pontjainak összege (10) nem egyezik a vizsga összpontszámával (25).')

    const ok = await publish()
    expect(ok.status).toBe(200)
    expect(ok.body.data).toMatchObject({ id: exam.id, is_published: true })
    expect(sheetPart?.rubric_status).toBe('complete')

    // Közzétett vizsgához új rész nem adható, a sorrend módosítható.
    const locked = await addAdminExamPart(admin, exam.id, { key: 'szoveg', name: 'Új', exercise_id: null, points: 0, minutes: 0 })
    expect(locked.status).toBe(422)
    expect(locked.errorBody.message).toBe('Közzétett vizsgához nem adható új rész. Előbb vond vissza a közzétételt.')
    expect((await reorderAdminExamParts(admin, exam.id, [must(sheetPart).id])).status).toBe(204)

    await unpublish(admin, ok.body.data)
    expect((await adminExam(admin, exam.id)).body.data.is_published).toBe(false)
  })

  test('a közzétett vizsga megjelenik a listán és a diák számára; a visszavonás eltünteti', { tag: '@regression' }, async ({ apiClient }) => {
    const { admin, student } = await actors(apiClient)
    const exam = await publishedExam(admin)

    expect((await listExams(apiClient)).body.data.map((item) => item.id)).toContain(exam.id)
    expect((await examDetail(student, exam.id)).status).toBe(200)
    expect((await startAttempt(student, exam.id, 'practice')).status).toBe(201)

    await unpublish(admin, exam)
    expect((await listExams(apiClient)).body.data.map((item) => item.id)).not.toContain(exam.id)
    expect((await examDetail(student, exam.id)).status).toBe(404)
  })

  test('a forrás-zip feltöltése megjelenik a szerkesztőben és a diák részleteiben; az új a régit cseréli, a törlés megy', { tag: '@regression' }, async ({ apiClient }) => {
    const { admin, student } = await actors(apiClient)
    const exam = await publishedExam(admin)

    const uploaded = await uploadExamZip(admin, exam.id, fixtureFile(FIXTURE_FILES.sourceZip))
    expect(uploaded.status).toBe(201)
    expect(uploaded.body.data).toMatchObject({ role: 'source_zip', name: FIXTURE_FILES.sourceZip })

    const files = (await adminExam(admin, exam.id)).body.data.files
    expect(files).toMatchObject([{ id: uploaded.body.data.id, name: FIXTURE_FILES.sourceZip }])

    const zip = (await examDetail(student, exam.id)).body.data.source_zip
    expect(zip).toMatchObject({ name: FIXTURE_FILES.sourceZip })
    expect((await apiClient.getBinary(must(zip).url)).status).toBe(200)

    const replaced = await uploadExamZip(admin, exam.id, fixtureFile(FIXTURE_FILES.sourceZip, 'masik.zip'))
    expect(replaced.status).toBe(201)
    expect(replaced.body.data.id).toBe(uploaded.body.data.id)
    expect((await adminExam(admin, exam.id)).body.data.files).toMatchObject([{ name: 'masik.zip' }])

    expect((await uploadExamZip(admin, exam.id, fixtureFile(FIXTURE_FILES.sheetOk))).status).toBe(422)
    expect((await uploadExamZip(admin, exam.id)).status).toBe(422)

    expect((await deleteAttachment(admin, uploaded.body.data.id)).status).toBe(204)
    expect((await adminExam(admin, exam.id)).body.data.files).toEqual([])
    expect((await examDetail(student, exam.id)).body.data.source_zip).toBeNull()

    await unpublish(admin, exam)
  })
})
