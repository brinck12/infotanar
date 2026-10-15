import { adminAccount, verifiedStudent } from '../../src/api/areas/accounts'
import { uploadAttachment } from '../../src/api/areas/attachments'
import { createRubricItem, rubricItemInput, updateRubricItem } from '../../src/api/areas/rubrics'
import { adminExercise, createExercise, createTestCase, deleteExercise, updateExercise, verifyExercise } from '../../src/api/areas/typedTasks'
import type { ApiClient } from '../../src/api/ApiClient'
import type { AdminExercise, AdminExercisePayload, DataEnvelope } from '../../src/api/types'
import { ECHO_PROGRAM, fixtureFile, FIXTURE_FILES, JUDGE0_CONTROL, SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const BASE: AdminExercisePayload = {
  lesson_id: SEEDED.typed.sheetUpload.lessonId,
  title: 'PW verify: ideiglenes feladat',
  description: 'Playwright API teszt: a teszt végén törlődik.',
  level: 'kozep',
  difficulty: 1,
}

const UPLOAD_SPEC = { accepted_extensions: ['.xlsx'] }
const WEB_FILE = { name: 'index.html', language: 'html', content: '<title></title>' }
const TITLE_CHECK = { label: 'Az oldal címe „Teszt”', points: 1, type: 'title', value: 'Teszt' }

const WRONG_PROGRAM = `print(input())  # ${JUDGE0_CONTROL.forceWrong}`

const createdExercises: number[] = []
const createdLessons: number[] = []
const createdModules: number[] = []

async function newExercise(admin: ApiClient, overrides: AdminExercisePayload = {}): Promise<AdminExercise> {
  const created = await createExercise(admin, { ...BASE, allowed_languages: ['python'], ...overrides })
  if (created.status !== 201) throw new Error(`A feladat letrehozasa sikertelen (${String(created.status)}): ${JSON.stringify(created.errorBody)}`)

  createdExercises.push(created.body.data.id)
  return created.body.data
}

/** Python feladat egy nyilvanos tesztesettel (az echo program atmegy rajta). */
async function codeExercise(admin: ApiClient, overrides: AdminExercisePayload = {}): Promise<AdminExercise> {
  const exercise = await newExercise(admin, overrides)
  const testCase = await createTestCase(admin, exercise.id, { stdin: 'alma\n', expected_stdout: 'alma\n', is_hidden: false })
  expect(testCase.status).toBe(201)
  return exercise
}

interface LessonResult {
  status: number
  id: number
  errors: Record<string, string[] | undefined>
}

/** Uj lecke egy sajat modulban (a fixture temakorok szamai nem valtoznak). */
async function newLesson(admin: ApiClient, overrides: Record<string, unknown> = {}): Promise<LessonResult> {
  if (createdModules.length === 0) {
    const tracks = await admin.get<DataEnvelope<{ id: number }[]>>('admin/tracks')
    const trackId = tracks.body.data[0]?.id
    if (trackId === undefined) throw new Error('Nincs track a fixture adatbazisban')
    const created = await admin.post<DataEnvelope<{ id: number }>>('admin/modules', { track_id: trackId, slug: `pw-verify-${String(Date.now())}`, title: 'PW verify modul' })
    expect(created.status).toBe(201)
    createdModules.push(created.body.data.id)
  }

  const slug = `pw-verify-${String(Date.now())}-${String(createdLessons.length)}`
  const response = await admin.post<DataEnvelope<{ id: number }>>('admin/lessons', { module_id: createdModules[0], slug, title: 'PW verify lecke', ...overrides })
  if (response.status === 201) createdLessons.push(response.body.data.id)

  return { status: response.status, id: response.status === 201 ? response.body.data.id : 0, errors: response.status === 422 ? response.errorBody.errors : {} }
}

test.afterEach(async ({ apiClient }) => {
  const admin = await adminAccount(apiClient)

  for (const id of createdExercises.splice(0)) await deleteExercise(admin.client, id)
  for (const id of createdLessons.splice(0)) await admin.client.delete(`admin/lessons/${String(id)}`)
  for (const id of createdModules.splice(0)) await admin.client.delete(`admin/modules/${String(id)}`)
})

test.describe('Publikálási kapu: kódfeladat', () => {
  test('mintamegoldás nélkül nem publikálható, mintamegoldással igen', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await codeExercise(admin.client)

    const without = await updateExercise(admin.client, exercise.id, { is_published: true })
    expect(without.status).toBe(422)
    expect(without.errorBody.errors.is_published?.[0]).toContain('mintamegoldás')

    // Csak szóköz: üresnek számít.
    const blank = await updateExercise(admin.client, exercise.id, { sample_solutions: { python: '   ' }, is_published: true })
    expect(blank.status).toBe(422)

    const published = await updateExercise(admin.client, exercise.id, { sample_solutions: { python: ECHO_PROGRAM }, is_published: true })
    expect(published.status).toBe(200)
    expect(published.body.data).toMatchObject({ is_published: true, sample_solutions: { python: ECHO_PROGRAM } })
  })

  test('mintamegoldás nem adható meg nem engedélyezett nyelvre, és diáknak nem látszik', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await codeExercise(admin.client)

    const wrongLanguage = await updateExercise(admin.client, exercise.id, { sample_solutions: { csharp: 'class A {}' } })
    expect(wrongLanguage.status).toBe(422)
    expect(wrongLanguage.errorBody.errors).toHaveProperty('sample_solutions')

    const saved = await updateExercise(admin.client, exercise.id, { sample_solutions: { python: ECHO_PROGRAM }, is_published: true })
    expect(saved.status).toBe(200)
    const student = await apiClient.task(exercise.id)
    expect(JSON.stringify(student.body)).not.toContain('sample_solutions')
  })

  test('a seedelt feladat mintamegoldását az admin látja, a diák egyik nézete sem adja ki', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const taskId = await apiClient.taskIdByTitle(SEEDED.tasks.main)

    const adminView = await adminExercise(admin.client, taskId)
    expect(adminView.body.data.sample_solutions).toMatchObject({ python: SEEDED.mainTask.pythonSample })
    expect(adminView.body.data.is_published).toBe(true)

    const views = [
      ['feladat', await apiClient.task(taskId)],
      ['feladatlista', await apiClient.tasks()],
      ['track', await apiClient.get(`tracks/${SEEDED.mainLesson.trackSlug}`)],
      ['lecke', await apiClient.get(`tracks/${SEEDED.mainLesson.trackSlug}/lessons/${SEEDED.mainLesson.lessonSlug}`)],
    ] as const

    for (const [name, view] of views) {
      expect(view.status, `${name} nézet`).toBe(200)
      const body = JSON.stringify(view.body)
      expect(body, `${name} nézet`).not.toContain('sample_solutions')
      expect(body, `${name} nézet`).not.toContain(SEEDED.mainTask.pythonSample.trim())
    }
  })

  test('teszteset nélkül a mintamegoldás sem elég', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newExercise(admin.client, { sample_solutions: { python: ECHO_PROGRAM } })

    const response = await updateExercise(admin.client, exercise.id, { is_published: true })
    expect(response.status).toBe(422)
    expect(response.errorBody.errors).toHaveProperty('is_hidden')
  })
})

test.describe('Publikálási kapu: fájlfeladat', () => {
  test('mintamegoldás fájl nélkül, hibás értékelőlappal nem, hibátlannal igen', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newExercise(admin.client, { kind: 'sheet_upload', allowed_languages: [], spec: UPLOAD_SPEC })
    const good = await createRubricItem(admin.client, exercise.id, rubricItemInput({ property: 'Munka1!B2', expected: '42' }))
    expect(good.status).toBe(201)

    const noSample = await updateExercise(admin.client, exercise.id, { is_published: true })
    expect(noSample.status).toBe(422)
    expect(noSample.errorBody.errors.is_published?.[0]).toContain('mintamegoldás')

    expect((await uploadAttachment(admin.client, exercise.id, fixtureFile(FIXTURE_FILES.sheetOk), { role: 'sample_solution' })).status).toBe(201)

    // Olyan pont, amit a mintamegoldás nem teljesít: az értékelőlap hibás.
    const bad = await createRubricItem(admin.client, exercise.id, rubricItemInput({ property: 'Munka1!B2', expected: '43' }))
    expect(bad.status).toBe(201)
    const invalid = await updateExercise(admin.client, exercise.id, { is_published: true })
    expect(invalid.status).toBe(422)
    expect(invalid.errorBody.errors.is_published?.[0]).toContain('értékelőlap')

    const fixed = await updateRubricItem(admin.client, bad.body.data.id, rubricItemInput({ property: 'Munka1!B2', expected: '42' }))
    expect(fixed.status).toBe(200)
    const published = await updateExercise(admin.client, exercise.id, { is_published: true })
    expect(published.status).toBe(200)
  })
})

test.describe('Publikálási kapu: lecke', () => {
  test('üres lecke nem publikálható létrehozáskor és módosításkor sem', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)

    const atCreation = await newLesson(admin.client, { is_published: true })
    expect(atCreation.status).toBe(422)
    expect(atCreation.errors.is_published?.[0]).toContain('Üres lecke')

    const draft = await newLesson(admin.client, { is_published: false })
    expect(draft.status).toBe(201)

    const publish = await admin.client.patch<unknown>(`admin/lessons/${String(draft.id)}`, { is_published: true })
    expect(publish.status).toBe(422)
    expect(publish.errorBody.errors).toHaveProperty('is_published')

    // Nem létező videóútvonal és üres jegyzet: továbbra is üres.
    const ghostVideo = await admin.client.patch<unknown>(`admin/lessons/${String(draft.id)}`, { video_path: 'nincs/ilyen.mp4', content: '  ', is_published: true })
    expect(ghostVideo.status).toBe(422)
  })

  test('jegyzettel vagy feladattal publikálható', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)

    const withNotes = await newLesson(admin.client, { content: 'Tananyag szöveg.', is_published: true })
    expect(withNotes.status).toBe(201)

    const draft = await newLesson(admin.client, { is_published: false })
    await newExercise(admin.client, { lesson_id: draft.id })
    const publish = await admin.client.patch<DataEnvelope<{ is_published: boolean }>>(`admin/lessons/${String(draft.id)}`, { is_published: true })
    expect(publish.status).toBe(200)
    expect(publish.body.data.is_published).toBe(true)
  })
})

test.describe('POST /admin/exercises/{id}/verify', () => {
  test('vendég 401, diák 403, hiányzó feladat 404', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await codeExercise(admin.client, { sample_solutions: { python: ECHO_PROGRAM } })

    expect((await verifyExercise(apiClient, exercise.id)).status).toBe(401)
    const student = await verifiedStudent(apiClient, admin.client)
    expect((await verifyExercise(student.client, exercise.id)).status).toBe(403)
    expect((await verifyExercise(admin.client, 999999)).status).toBe(404)
  })

  test('átmenő mintamegoldás: teszteset-szintű eredmény', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await codeExercise(admin.client, { sample_solutions: { python: ECHO_PROGRAM } })
    await createTestCase(admin.client, exercise.id, { stdin: 'korte\n', expected_stdout: 'korte\n', is_hidden: true })

    const result = await verifyExercise(admin.client, exercise.id)

    expect(result.status).toBe(200)
    expect(result.body.data).toMatchObject({ exercise_id: exercise.id, kind: 'code', status: 'passed', message: null })
    const run = result.body.data.runs[0]
    expect(run).toMatchObject({ language: 'python', passed: true, verdict: 'accepted', score: 2, max_score: 2 })
    // A rejtett teszteset is lefut, de csak a megfelelt/nem megfelelt derül ki belőle.
    expect(run?.tests.map((row) => [row.hidden, row.passed])).toEqual([[false, true], [true, true]])
  })

  test('hibás mintamegoldás: nem átment, a hibás teszteset látszik', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await codeExercise(admin.client, { sample_solutions: { python: WRONG_PROGRAM } })

    const result = await verifyExercise(admin.client, exercise.id)

    expect(result.status).toBe(200)
    expect(result.body.data.status).toBe('failed')
    expect(result.body.data.runs[0]).toMatchObject({ passed: false, verdict: 'wrong_answer' })
    expect(result.body.data.runs[0]?.tests[0]).toMatchObject({ passed: false, verdict: 'wrong_answer' })
  })

  test('mintamegoldás nélkül hiba, böngészős feladat kimarad', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const code = await codeExercise(admin.client)
    const web = await newExercise(admin.client, { kind: 'web', allowed_languages: [], spec: { files: [WEB_FILE], checks: [TITLE_CHECK] } })

    const missing = await verifyExercise(admin.client, code.id)
    expect(missing.body.data).toMatchObject({ status: 'failed', message: 'hiányzik a mintamegoldás', runs: [] })

    const skipped = await verifyExercise(admin.client, web.id)
    expect(skipped.body.data).toMatchObject({ kind: 'web', status: 'skipped', runs: [] })
  })

  test('fájlfeladat: a mintamegoldás az értékelőlapon fut', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newExercise(admin.client, { kind: 'sheet_upload', allowed_languages: [], spec: UPLOAD_SPEC })

    expect((await verifyExercise(admin.client, exercise.id)).body.data.status).toBe('failed')

    await createRubricItem(admin.client, exercise.id, rubricItemInput({ property: 'Munka1!B2', expected: '42' }))
    await uploadAttachment(admin.client, exercise.id, fixtureFile(FIXTURE_FILES.sheetOk), { role: 'sample_solution' })

    const result = await verifyExercise(admin.client, exercise.id)
    expect(result.status).toBe(200)
    expect(result.body.data).toMatchObject({ kind: 'sheet_upload', status: 'passed' })
  })
})
