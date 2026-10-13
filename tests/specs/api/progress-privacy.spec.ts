import type { ApiClient } from '../../src/api/ApiClient'
import { ORAL_TOPICS, oralPracticeInput, saveOralPractice, savePreferences, studyPreferences } from '../../src/api/areas/learning'
import { accountExport, completeLesson, deleteAccount, progress, taskIdsWithStatus, taskStatus } from '../../src/api/areas/progress'
import { fileSubmission, saveManualMarks, uploadFileSubmission } from '../../src/api/areas/fileTasks'
import { FIXTURE_FILES, registration, SEEDED } from '../../src/data'
import { fixtureFile } from '../../src/data/files'
import { expect, test } from '../../src/fixtures'
import { ageFileSubmission, pruneOrphans, rowCount, runRetentionJob, seedExamAttempt, statusQueryCount } from '../../src/support/artisan'
import { plantExerciseFile, plantSubmissionFile, submissionFileExists, userSubmissionDir } from '../../src/support/submissionDisk'
import { existsSync, rmSync } from 'node:fs'

/**
 * WP8: a fajlfeladatok es a vizsgasorok szerepe a haladasban, az adatexport, a fiok torlese es a megorzesi takaritasok.
 *
 * Minden teszt sajat friss diakot hoz letre (a megosztott fixture-felhasznalok es -feladatok allapota valtozatlan marad).
 * A vizsgaprobalkozasokat a WP6 vegpontjai helyett a teszt-adatbazisba irt sorok adjak (src/support/artisan.ts),
 * ezert nincs `test.fixme`: minden eset valodi.
 */

const SHEET = SEEDED.typed.sheetUpload
const WEB = SEEDED.typed.web
const MANUAL_MARK = { [String(SHEET.manualItemId)]: true }

async function student(apiClient: ApiClient): Promise<{ client: ApiClient; id: number; token: string; password: string; email: string }> {
  const payload = registration()
  const account = await apiClient.signUp(payload)

  return { client: account.client, id: account.user.id, token: account.token, password: payload.password, email: payload.email }
}

async function lessonStatus(client: ApiClient, lessonId: number): Promise<string | undefined> {
  const { body } = await progress(client)

  return body.data.tracks.flatMap((track) => track.lessons).find((lesson) => lesson.id === lessonId)?.status
}

test.describe('Haladás: fájlfeladatok', () => {
  test('a megoldott (10/10) fájlbeadás megoldottá teszi a feladatot, teljesíti a leckét, és kiesik a megoldatlanok közül', { tag: '@smoke' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)
    expect((await taskStatus(client, SHEET.id)).body.data.my_status).toBeNull()
    expect(await taskIdsWithStatus(client, 'unsolved')).toContain(SHEET.id)

    const upload = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))
    expect(upload.status).toBe(201)
    const marked = await saveManualMarks(client, upload.body.data.id, MANUAL_MARK)
    expect(marked.status).toBe(200)
    expect(marked.body.data.score).toBe(SHEET.expected.okWithManualMark.score)

    expect((await taskStatus(client, SHEET.id)).body.data.my_status).toBe('solved')
    expect(await lessonStatus(client, SHEET.lessonId)).toBe('completed')
    expect(await taskIdsWithStatus(client, 'unsolved')).not.toContain(SHEET.id)
    expect(await taskIdsWithStatus(client, 'solved')).toContain(SHEET.id)
    expect(await taskIdsWithStatus(client, 'attempted')).not.toContain(SHEET.id)
  })

  test('a gyenge beadás (2/10) megkísérelt állapotot ad, és a lecke nem teljesül', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)

    const upload = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetWrong))

    expect(upload.status).toBe(201)
    expect(upload.body.data.score).toBe(SHEET.expected.wrong.score)
    expect((await taskStatus(client, SHEET.id)).body.data.my_status).toBe('attempted')
    expect(await lessonStatus(client, SHEET.lessonId)).toBe('in_progress')
    expect(await taskIdsWithStatus(client, 'attempted')).toContain(SHEET.id)
    expect(await taskIdsWithStatus(client, 'unsolved')).toContain(SHEET.id)
    expect(await taskIdsWithStatus(client, 'solved')).not.toContain(SHEET.id)
  })

  test('a vizsgaprobalkozás feltöltése semmit nem változtat a haladáson', { tag: '@regression' }, async ({ apiClient }) => {
    const { client, id } = await student(apiClient)
    // Egy mar megoldottnak ertekelt (passed) vizsgasor az 5. feladatra, a gyakorlo allapot nelkul.
    seedExamAttempt(id)

    expect((await taskStatus(client, SHEET.id)).body.data.my_status).toBeNull()
    expect(await lessonStatus(client, SHEET.lessonId)).toBe('not_started')
    expect(await taskIdsWithStatus(client, 'unsolved')).toContain(SHEET.id)
    expect(await taskIdsWithStatus(client, 'solved')).not.toContain(SHEET.id)
    expect(await taskIdsWithStatus(client, 'attempted')).not.toContain(SHEET.id)
  })
})

test.describe('Haladás: böngészős feladatok', () => {
  test('a csak weboldal-feladatot tartalmazó lecke kézzel teljesíthető', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)

    const done = await completeLesson(client, WEB.lessonId)

    expect(done.status).toBe(200)
    expect(done.body.data).toEqual({ lesson_id: WEB.lessonId, status: 'completed' })
    expect(await lessonStatus(client, WEB.lessonId)).toBe('completed')
  })

  test('a szerveren értékelt feladatot tartalmazó lecke nem jelölhető késznek (409)', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)

    const result = await completeLesson(client, SHEET.lessonId)

    expect(result.status).toBe(409)
    expect(await lessonStatus(client, SHEET.lessonId)).not.toBe('completed')
  })
})

test.describe('Haladás: lekérdezésszám', () => {
  test('az ExerciseStatuses::for lekérdezésszáma nem függ a beadások számától', { tag: '@regression' }, async ({ apiClient }) => {
    const none = await student(apiClient)
    const one = await student(apiClient)
    const many = await student(apiClient)

    expect((await uploadFileSubmission(one.client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetWrong))).status).toBe(201)
    for (const file of [FIXTURE_FILES.sheetWrong, FIXTURE_FILES.sheetOk, FIXTURE_FILES.sheetOds]) {
      expect((await uploadFileSubmission(many.client, SHEET.id, fixtureFile(file))).status).toBe(201)
    }
    // Vizsgasorok es tobb feladat: a lekerdezesek szama ettol sem valtozhat.
    seedExamAttempt(many.id)
    seedExamAttempt(many.id)

    const counts = [statusQueryCount(none.id), statusQueryCount(one.id), statusQueryCount(many.id)]

    test.info().annotations.push({ type: 'lekerdezesek (nincs, egy, sok beadas)', description: counts.join(', ') })
    expect(new Set(counts).size, `lekerdezesszamok: ${counts.join(', ')}`).toBe(1)
    expect(counts[0]).toBeLessThanOrEqual(2)
  })
})

test.describe('Adatexport', () => {
  test('tartalmazza a célokat, a szóbeli gyakorlást, a fájlbeadásokat és a vizsgaprobálkozásokat', { tag: '@regression' }, async ({ apiClient }) => {
    const { client, id } = await student(apiClient)
    const goals = studyPreferences()
    expect((await savePreferences(client, goals)).status).toBe(200)
    const topic = ORAL_TOPICS[0]
    expect((await saveOralPractice(client, topic, oralPracticeInput())).status).toBe(200)
    const upload = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))
    expect(upload.status).toBe(201)
    const exam = seedExamAttempt(id)

    const exported = await accountExport(client)

    expect(exported.status).toBe(200)
    const data = exported.body
    expect(data.preferences).toMatchObject({ ...goals })
    expect(data.oral_practice).toHaveLength(1)
    expect(data.oral_practice[0]).toMatchObject({ topic, checked: [0, 2], notes: oralPracticeInput().notes })
    // A kozos fajlbeadas-lista a gyakorlo es a vizsgasort is tartalmazza.
    expect(data.file_submissions.map((row) => row.exam_attempt_id)).toEqual([null, exam.attemptId])
    const practice = data.file_submissions[0]
    expect(practice).toMatchObject({
      id: upload.body.data.id,
      exercise: { id: SHEET.id, title: SHEET.title },
      attempt: 1,
      file_name: FIXTURE_FILES.sheetOk,
      status: 'evaluated',
      score: SHEET.expected.ok.score,
      max_score: SHEET.rubricTotal,
    })
    expect(practice).not.toHaveProperty('path')
    expect(data.exam_attempts).toHaveLength(1)
    expect(data.exam_attempts[0]).toMatchObject({
      id: exam.attemptId,
      exam: { id: SEEDED.exams.main.id, title: SEEDED.exams.main.title, level: SEEDED.exams.main.level },
      mode: 'practice',
      state: 'evaluated',
      score: 10,
      max_score: 20,
    })
  })

  test('üres fióknál is megvannak a kulcsok', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)

    const exported = await accountExport(client)

    expect(exported.status).toBe(200)
    expect(exported.body.preferences).toBeNull()
    expect(exported.body.oral_practice).toEqual([])
    expect(exported.body.file_submissions).toEqual([])
    expect(exported.body.exam_attempts).toEqual([])
  })
})

test.describe('Fiók törlése', () => {
  test('a feltöltött fájlok, a vizsgaprobálkozások, a szóbeli gyakorlás és a célok nyomtalanul eltűnnek', { tag: '@smoke' }, async ({ apiClient, request }) => {
    const { client, id, token, password, email } = await student(apiClient)
    expect((await savePreferences(client, studyPreferences())).status).toBe(200)
    expect((await saveOralPractice(client, ORAL_TOPICS[0], oralPracticeInput())).status).toBe(200)
    expect((await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))).status).toBe(201)
    const exam = seedExamAttempt(id)
    expect(existsSync(userSubmissionDir(id))).toBe(true)
    expect(submissionFileExists(exam.path)).toBe(true)

    const status = await deleteAccount(request, token, password)

    expect(status).toBe(204)
    expect(existsSync(userSubmissionDir(id))).toBe(false)
    expect(rowCount('file_submissions', id)).toBe(0)
    expect(rowCount('exam_attempts', id)).toBe(0)
    expect(rowCount('oral_practices', id)).toBe(0)
    expect((await client.me()).status).toBe(401)
    expect((await apiClient.login({ email, password })).status).not.toBe(200)
  })

  test('rossz jelszóval nem töröl semmit', { tag: '@regression' }, async ({ apiClient, request }) => {
    const { client, id, token } = await student(apiClient)
    expect((await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))).status).toBe(201)

    const status = await deleteAccount(request, token, 'nem-ez-a-jelszo')

    expect(status).toBe(422)
    expect(existsSync(userSubmissionDir(id))).toBe(true)
    expect(rowCount('file_submissions', id)).toBe(1)
  })
})

test.describe('Megőrzési takarítás', () => {
  test('a megőrzési idő utáni gyakorló beadás és vizsgaprobálkozás a fájljával együtt törlődik, a friss megmarad', { tag: '@regression' }, async ({ apiClient }) => {
    const { client, id } = await student(apiClient)
    const old = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetWrong))
    const fresh = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))
    expect(old.status).toBe(201)
    expect(fresh.status).toBe(201)
    ageFileSubmission(old.body.data.id, 400)
    const oldExam = seedExamAttempt(id, 400)
    const freshExam = seedExamAttempt(id, 1)

    runRetentionJob()

    expect((await fileSubmission(client, old.body.data.id)).status).toBe(404)
    expect((await fileSubmission(client, fresh.body.data.id)).status).toBe(200)
    expect(submissionFileExists(oldExam.path)).toBe(false)
    expect(submissionFileExists(freshExam.path)).toBe(true)
    expect(rowCount('exam_attempts', id)).toBe(1)
    expect(rowCount('file_submissions', id)).toBe(2)
  })

  test('files:prune-orphans: a sor nélküli régi fájlt törli, a frisset és a sorral bírót nem, a szerzői fájlt csak jelenti', { tag: '@regression' }, async ({ apiClient }) => {
    const { client, id } = await student(apiClient)
    const kept = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))
    expect(kept.status).toBe(201)
    const oldOrphan = `u${String(id)}/e1/arva-regi.txt`
    const freshOrphan = `u${String(id)}/e1/arva-friss.txt`
    plantSubmissionFile(oldOrphan, 3)
    plantSubmissionFile(freshOrphan, 0)
    const authored = plantExerciseFile(`pw-wp8-${String(id)}/szerzoi-arva.txt`)

    const output = pruneOrphans()
    const stillThere = existsSync(authored)
    rmSync(authored, { force: true })

    expect(submissionFileExists(oldOrphan)).toBe(false)
    expect(submissionFileExists(freshOrphan)).toBe(true)
    expect((await fileSubmission(client, kept.body.data.id)).status).toBe(200)
    expect(stillThere).toBe(true)
    expect(output).toContain(`pw-wp8-${String(id)}/szerzoi-arva.txt`)
    expect(output).toContain('nem töröljük')
  })
})
