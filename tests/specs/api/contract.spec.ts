/**
 * REL-3: API-frontend szerzodes-ellenorzes. A valodi backend valaszait zod semak
 * (src/api/schemas) ellen validaljuk, amelyek a frontend `src/types` tipusait tukrozik:
 * ha a backend valasza elter attol, amit a frontend var, itt bukik, nem csak a bongeszoben.
 */
import type { z } from 'zod'
import { adminAccount, premiumStudent, verifiedStudent } from '../../src/api/areas/accounts'
import { uploadPartFile } from '../../src/api/areas/exams'
import { uploadFileSubmission } from '../../src/api/areas/fileTasks'
import type { ApiClient } from '../../src/api/ApiClient'
import {
  accountExportResponse,
  adminOverviewResponse,
  adminUsersResponse,
  billingProfileResponse,
  completeLessonResponse,
  examAttemptResponse,
  examDetailResponse,
  examResultResponse,
  examsResponse,
  fileSubmissionResponse,
  languagesResponse,
  lessonResponse,
  loginResponse,
  meResponse,
  providersResponse,
  rhythmResponse,
  parseContract,
  paymentsResponse,
  planResponse,
  preferencesResponse,
  progressResponse,
  runResponse,
  subscriptionResponse,
  submissionDetailResponse,
  submissionResponse,
  submissionsResponse,
  taskResponse,
  tasksResponse,
  topicsResponse,
  trackResponse,
  tracksResponse,
} from '../../src/api/schemas'
import { DEFAULT_PASSWORD, FIXTURE_FILES, registration, SEEDED } from '../../src/data'
import { fixtureFile } from '../../src/data/files'
import { expect, test } from '../../src/fixtures'

const TRACK = 'pw-teszt-track'
const CODE_TASK = SEEDED.typed.subtasks
const SHEET = SEEDED.typed.sheetUpload
const MAIN_EXAM = SEEDED.exams.main
const [FILE_PART] = MAIN_EXAM.parts

/** A statuszt es a szerzodest egyutt ellenorzi. */
function expectContract<S extends z.ZodType>(result: { status: number; body: unknown }, schema: S, label: string): z.infer<S> {
  expect(result.status, label).toBe(200)
  return parseContract(schema, result.body, label)
}

async function premium(apiClient: ApiClient): Promise<{ admin: ApiClient; student: ApiClient }> {
  const admin = (await adminAccount(apiClient)).client
  return { admin, student: (await premiumStudent(apiClient, admin)).client }
}

test.describe('Szerzodes: fiok es elofizetes @regression', () => {
  test('login, me, plan, subscription, billing profile, payments, preferences', async ({ apiClient }) => {
    const credentials = registration()
    const { client } = await apiClient.signUp(credentials)

    const login = await apiClient.login({ email: credentials.email, password: DEFAULT_PASSWORD })
    expectContract(login, loginResponse, 'POST /auth/login')

    expect(expectContract(await client.me(), meResponse, 'GET /auth/me').data.email).toBe(credentials.email)
    expectContract(await apiClient.get('billing/plan'), planResponse, 'GET /billing/plan')
    expectContract(await client.get('billing/subscription'), subscriptionResponse, 'GET /billing/subscription')
    expectContract(await client.get('billing/profile'), billingProfileResponse, 'GET /billing/profile')
    expectContract(await client.get('billing/payments'), paymentsResponse, 'GET /billing/payments')
    expectContract(await client.get('account/preferences'), preferencesResponse, 'GET /account/preferences')
    expectContract(await client.get('account/export'), accountExportResponse, 'GET /account/export')
    expectContract(await apiClient.get('auth/providers'), providersResponse, 'GET /auth/providers')
    expectContract(await client.get('progress/rhythm'), rhythmResponse, 'GET /progress/rhythm')
    expectContract(await client.put('account/notifications', { enabled: false }), meResponse, 'PUT /account/notifications')
  })
})

test.describe('Szerzodes: katalogus es feladat @regression', () => {
  test('tracks, track, lesson (nyitott es zarolt), topics, languages, tasks, task', async ({ apiClient }) => {
    const { student } = await premium(apiClient)

    expectContract(await apiClient.get('tracks'), tracksResponse, 'GET /tracks (vendeg)')
    expectContract(await student.get('tracks'), tracksResponse, 'GET /tracks (diak)')
    expectContract(await apiClient.get(`tracks/${TRACK}`), trackResponse, 'GET /tracks/{slug} (vendeg)')
    expectContract(await student.get(`tracks/${TRACK}`), trackResponse, 'GET /tracks/{slug} (diak)')

    expectContract(await apiClient.get(`tracks/${TRACK}/lessons/pw-teszt-osszegzes`), lessonResponse, 'GET lesson (ingyenes, vendeg)')
    const locked = expectContract(await apiClient.get(`tracks/${TRACK}/lessons/pw-teszt-szoveg-feltoltes`), lessonResponse, 'GET lesson (zarolt, vendeg)')
    expect(locked.data.locked).toBe(true)
    const open = expectContract(await student.get(`tracks/${TRACK}/lessons/pw-teszt-szoveg-feltoltes`), lessonResponse, 'GET lesson (fizetos, premium diak)')
    expect(open.data.locked).toBe(false)

    expectContract(await apiClient.get('topics'), topicsResponse, 'GET /topics')
    expectContract(await apiClient.get('languages'), languagesResponse, 'GET /languages')
    expectContract(await apiClient.get('tasks'), tasksResponse, 'GET /tasks (vendeg)')
    expectContract(await student.get('tasks'), tasksResponse, 'GET /tasks (diak)')

    // Minden feladatfajta egy-egy peldaja: kod, tablazat-feltoltes, zarolt feltoltes, web, bongeszos tablazat.
    for (const id of [1, CODE_TASK.id, SHEET.id, SEEDED.typed.web.id, SEEDED.typed.sheetBrowser.id]) {
      expectContract(await student.get(`tasks/${String(id)}`), taskResponse, `GET /tasks/${String(id)} (diak)`)
    }
    const lockedTask = expectContract(await apiClient.get(`tasks/${String(SEEDED.typed.docUpload.id)}`), taskResponse, 'GET /tasks/{zarolt} (vendeg)')
    expect(lockedTask.data.locked).toBe(true)
  })

  test('progress es lecke teljesitese', async ({ apiClient }) => {
    const { student } = await premium(apiClient)

    expect(expectContract(await student.get('progress'), progressResponse, 'GET /progress (ures)').data.overall.completed).toBe(0)
    expectContract(await student.post(`lessons/${String(SEEDED.typed.web.lessonId)}/complete`, {}), completeLessonResponse, 'POST /lessons/{id}/complete')
    expectContract(await student.get('progress'), progressResponse, 'GET /progress (teljesitett lecke utan)')
  })
})

test.describe('Szerzodes: futtatas es beadas @regression', () => {
  test('run, submission (+ lista, reszletek), reszfeladatos run, fajlbeadas', async ({ apiClient }) => {
    const { student } = await premium(apiClient)
    const payload = { task_id: 1, language: 'python', source_code: 'print(1)' }

    expectContract(await student.post('run', payload), runResponse, 'POST /run')
    expectContract(await student.post('run', { task_id: CODE_TASK.id, language: 'python', source_code: 'print(1)' }), runResponse, 'POST /run (reszfeladatos)')

    const created = await student.post<{ submission_id: number }>('submissions', payload)
    const submission = expectContract(created, submissionResponse, 'POST /submissions')

    expectContract(await student.get(`submissions/${String(submission.submission_id)}`), submissionDetailResponse, 'GET /submissions/{id}')
    expectContract(await student.get('submissions'), submissionsResponse, 'GET /submissions')
    expectContract(await student.get('tasks/1/submissions'), submissionsResponse, 'GET /tasks/{id}/submissions')

    const uploaded = await uploadFileSubmission(student, SHEET.id, fixtureFile(FIXTURE_FILES.sheetWrong))
    expect(uploaded.status).toBe(201)
    parseContract(fileSubmissionResponse, uploaded.body, 'POST /exercises/{id}/file-submissions')
    expectContract(await student.get(`file-submissions/${String(uploaded.body.data.id)}`), fileSubmissionResponse, 'GET /file-submissions/{id}')
  })
})

test.describe('Szerzodes: vizsgak es admin @regression', () => {
  test('exams, exam, attempt (indul, feltoltes, beadas), result', async ({ apiClient }) => {
    const { student } = await premium(apiClient)

    expectContract(await apiClient.get('exams'), examsResponse, 'GET /exams (vendeg)')
    expectContract(await student.get(`exams/${String(MAIN_EXAM.id)}`), examDetailResponse, 'GET /exams/{id}')

    const started = await student.post<{ data: { id: number } }>(`exams/${String(MAIN_EXAM.id)}/attempts`, { mode: 'exam' })
    expect(started.status).toBe(201)
    parseContract(examAttemptResponse, started.body, 'POST /exams/{id}/attempts')
    const attemptId = started.body.data.id

    expectContract(await student.get(`exam-attempts/${String(attemptId)}`), examAttemptResponse, 'GET /exam-attempts/{id}')
    const uploaded = await uploadPartFile(student, attemptId, FILE_PART.id, fixtureFile(FIXTURE_FILES.sheetWrong))
    expectContract(uploaded, examAttemptResponse, 'POST /exam-attempts/{id}/parts/{part}/file')
    expectContract(await student.post(`exam-attempts/${String(attemptId)}/submit`, {}), examAttemptResponse, 'POST /exam-attempts/{id}/submit')
    expectContract(await student.get(`exam-attempts/${String(attemptId)}/result`), examResultResponse, 'GET /exam-attempts/{id}/result')
    expectContract(await student.get('exams'), examsResponse, 'GET /exams (diak, kitoltott probalkozassal)')
  })

  test('admin overview es felhasznalolista', async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    await verifiedStudent(apiClient, admin)

    expect(expectContract(await admin.get('admin/overview'), adminOverviewResponse, 'GET /admin/overview').data.users.total).toBeGreaterThan(0)
    expectContract(await admin.get('admin/users', { per_page: '10' }), adminUsersResponse, 'GET /admin/users')
  })
})
