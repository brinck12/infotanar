import type { ApiClient } from '../../src/api/ApiClient'
import { adminAccount } from '../../src/api/areas/accounts'
import {
  addTestCase,
  type CodeExerciseFixture,
  createCodeExercise,
  deleteCodeExercise,
  runSolution,
  setComparison,
  submitSolution,
} from '../../src/api/areas/execution'
import type { DataEnvelope, ExecutionComparison } from '../../src/api/types'
import { ECHO_PROGRAM, JUDGE0_CONTROL, registration, SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'
import { JUDGE0_EXECUTION_CONTROL, JUDGE0_FILE_OUTPUT } from '../../src/mocks/judge0/controls'

// A futtatasi keret vendegnel IP-nkent kozos (10/perc), es a run.spec meg a
// submissions.spec is abbol el. Itt ezert minden futtatas bejelentkezett
// diakkent megy: a keret fiokonkenti, igy a tobbi spectol fuggetlen.
const SUBTASKS = SEEDED.typed.subtasks
const PARTIAL = `print("${JUDGE0_EXECUTION_CONTROL.subtasks}")`
const FROM_FILE = `print(open("${SUBTASKS.source.name}").read())  # ${JUDGE0_EXECUTION_CONTROL.requireFile}`

const [first, second] = SUBTASKS.subtasks

/** Friss diak sajat futtatasi kerettel; az ingyenes leckekhez megerositett e-mail sem kell. */
async function student(apiClient: ApiClient): Promise<ApiClient> {
  return (await apiClient.signUp(registration())).client
}

test.describe('Futtatás: csak szerkesztős feladat futtatható', () => {
  test('fájlfeltöltős feladatra a futtatás és a beadás is 422-t ad a task_id mezőn', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const payload = { task_id: SEEDED.typed.sheetUpload.id, language: 'python', source_code: ECHO_PROGRAM }

    const run = await runSolution(client, payload)
    const submitted = await submitSolution(client, payload)

    for (const result of [run, submitted]) {
      expect(result.status).toBe(422)
      expect(result.errorBody.errors.task_id).toEqual(['Ehhez a feladathoz nem tartozik futtatható kód.'])
      expect(result.errorBody.errors).not.toHaveProperty('language')
    }
  })

  test('böngészős feladatra a futtatás 422-t ad', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)

    const run = await runSolution(client, { task_id: SEEDED.typed.web.id, language: 'python', source_code: ECHO_PROGRAM })

    expect(run.status).toBe(422)
    expect(run.errorBody.errors).toHaveProperty('task_id')
  })
})

test.describe('Részfeladatonkénti pontozás', () => {
  test('a futtatás részfeladatonként pontoz, és a látható teszteset hibájánál megmondja a várt értéket', { tag: '@smoke' }, async ({ apiClient }) => {
    const client = await student(apiClient)

    const { status, body } = await runSolution(client, { task_id: SUBTASKS.id, language: SUBTASKS.language, source_code: PARTIAL })

    expect(status).toBe(200)
    expect(body.status).toBe('failed')
    expect(body.verdict).toBe('wrong_answer')
    expect(body.subtasks).toEqual([
      { label: first.label, points: first.points, max_points: first.points, passed: true, note: null },
      { label: second.label, points: 0, max_points: second.points, passed: false, note: 'Várt: 6, kapott: 7' },
    ])
    expect(body).not.toHaveProperty('submission_id')
  })

  test('a beadás ugyanazt a pontozást adja, eltárolódik, és a lecke nem teljesül részpontszámmal', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)

    const run = await runSolution(client, { task_id: SUBTASKS.id, language: SUBTASKS.language, source_code: PARTIAL })
    const { status, body } = await submitSolution(client, { task_id: SUBTASKS.id, language: SUBTASKS.language, source_code: PARTIAL })

    expect(status).toBe(200)
    expect(body.status).toBe('failed')
    expect(body.subtasks).toEqual(run.body.subtasks)
    expect(body.lesson_completed).toBe(false)

    // Az elozmenyben megvan a beadas; a reszletes nezet csak iteleteket mutat, pontokat nem.
    const stored = await client.get<DataEnvelope<{ id: number; status: string }>>(`submissions/${String(body.submission_id)}`)
    expect(stored.status).toBe(200)
    expect(stored.body.data).toMatchObject({ id: body.submission_id, status: 'failed' })
    expect(stored.body.data).not.toHaveProperty('subtasks')

    const history = await client.get<DataEnvelope<{ id: number }[]>>(`tasks/${String(SUBTASKS.id)}/submissions`)
    expect(history.body.data.map((submission) => submission.id)).toContain(body.submission_id)
  })

  test('a hibátlan megoldás minden részre teljes pontot kap, és teljesíti a leckét', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)

    const { body } = await submitSolution(client, { task_id: SUBTASKS.id, language: SUBTASKS.language, source_code: FROM_FILE })

    expect(body.status).toBe('passed')
    expect(body.verdict).toBe('accepted')
    expect(body.subtasks).toEqual(
      SUBTASKS.subtasks.map((subtask) => ({ label: subtask.label, points: subtask.points, max_points: subtask.points, passed: true, note: null }))
    )
    expect(body.lesson_completed).toBe(true)
  })

  test('rejtett teszteset hibájánál nincs megjegyzés, és a rejtett eredményből semmi nem látszik', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const client = await student(apiClient)
    const payload = { task_id: SUBTASKS.id, language: SUBTASKS.language, source_code: PARTIAL }

    // A rejtett teszteset elvart kimenete szandekosan mas, mint a lathatoe: ha kiszivarogna, latszana.
    const hiddenId = await addTestCase(admin.client, SUBTASKS.id, { stdin: '', expected_stdout: '1. feladat\n3\n2. feladat\n4242\n', is_hidden: true })

    try {
      const submitted = await submitSolution(client, payload)

      expect(submitted.body.status).toBe('failed')
      expect(submitted.body.subtasks?.map((subtask) => [subtask.passed, subtask.note])).toEqual([
        [true, null],
        [false, null],
      ])
      expect(JSON.stringify(submitted.body)).not.toContain('4242')

      const [visible, hidden] = submitted.body.results
      // A lathato teszteset megmondja, mi tert el; a rejtett csak az iteletet.
      expect(visible?.difference).toBe('A(z) 6. elem eltér: ezt kaptuk: „7”, ezt vártuk: „6”.')
      expect(hidden).toEqual({
        test_case_id: hiddenId,
        hidden: true,
        passed: false,
        verdict: 'wrong_answer',
        verdict_label: 'Hibás kimenet',
        time: null,
        exit_code: null,
        judge_status: 'Hibás kimenet',
      })

      // A futtatas csak a lathato teszteseteken pontoz: ott megvan a megjegyzes.
      const run = await runSolution(client, payload)
      expect(run.body.results).toHaveLength(1)
      expect(run.body.subtasks?.[1]?.note).toBe('Várt: 6, kapott: 7')
    } finally {
      // A fixture feladat maradjon a seed szerinti: a tobbi spec egyetlen lathato tesztesetre szamit.
      const removed = await admin.client.delete(`admin/test-cases/${String(hiddenId)}`)
      expect(removed.status).toBe(204)
    }
  })

  test('rendszerhibánál minden részfeladat 0 pont, megjegyzés nélkül', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)

    const { body } = await runSolution(client, {
      task_id: SUBTASKS.id,
      language: SUBTASKS.language,
      source_code: `print("${JUDGE0_CONTROL.forceUnavailable}")`,
    })

    expect(body.status).toBe('error')
    expect(body.subtasks).toEqual(
      SUBTASKS.subtasks.map((subtask) => ({ label: subtask.label, points: 0, max_points: subtask.points, passed: false, note: null }))
    )
  })

  test('részfeladat nélküli feladatnál a válaszban nincs subtasks és nincs difference', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const id = await apiClient.taskIdByTitle(SEEDED.tasks.main)
    const wrong = { task_id: id, language: 'python', source_code: `print("${JUDGE0_CONTROL.forceWrong}")` }

    const run = await runSolution(client, { task_id: id, language: 'python', source_code: ECHO_PROGRAM })
    const failedRun = await runSolution(client, wrong)
    const submitted = await submitSolution(client, wrong)

    expect(run.body.status).toBe('passed')
    expect(failedRun.body.status).toBe('failed')
    for (const body of [run.body, failedRun.body, submitted.body]) {
      expect(body).not.toHaveProperty('subtasks')
      expect(body.results.some((result) => 'difference' in result)).toBe(false)
    }
    expect(Object.keys(run.body).sort()).toEqual(['results', 'status', 'verdict', 'verdict_label'])
    expect(Object.keys(submitted.body).sort()).toEqual(['lesson_completed', 'results', 'status', 'submission_id', 'verdict', 'verdict_label'])
  })
})

test.describe('Adatfájlok a futtatáshoz', () => {
  test('a forrásfájl a saját nevén, a saját tartalmával jut el a futtatóhoz', { tag: '@smoke' }, async ({ apiClient }) => {
    const client = await student(apiClient)

    const { body } = await runSolution(client, { task_id: SUBTASKS.id, language: SUBTASKS.language, source_code: FROM_FILE })

    // A mock a kimenetet a zipbol kiolvasott adatok.txt-bol szamolja ki.
    expect(body.status).toBe('passed')
    expect(body.results[0]?.stdout).toBe(SUBTASKS.expectedStdout)
  })

  test('fájl nélküli feladatnál a kérésben nincs additional_files mező', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const id = await apiClient.taskIdByTitle(SEEDED.tasks.main)

    const { body } = await runSolution(client, { task_id: id, language: 'python', source_code: FROM_FILE })

    expect(body.status).toBe('failed')
    expect(body.results.map((result) => result.stdout)).toEqual(Array(SEEDED.mainTask.exampleCount).fill(JUDGE0_FILE_OUTPUT.noArchive))
  })
})

test.describe('Kimenet-összehasonlítási módok', () => {
  // Az echo program a bemenetet irja ki, igy tesztesetenkent a bemenet a "kapott", az elvart pedig ettol elter.
  const CASES = [
    { name: 'tizedesvessző', stdin: '3.50\n', expected_stdout: '3,5\n' },
    { name: 'szóközök és sortörések', stdin: 'alma   körte\n\n12\n', expected_stdout: 'alma körte 12\n' },
    { name: 'ékezet nélküli kimenet', stdin: 'kerek\n', expected_stdout: 'kérek\n' },
    { name: 'tűrésen belüli szám', stdin: '3.14\n', expected_stdout: '3.15\n' },
    { name: 'kis- és nagybetű', stdin: 'IGEN\n', expected_stdout: 'igen\n' },
  ] as const

  /** Beallitasonkent: melyik teszteset megy at (a CASES sorrendjeben). */
  const MODES: { name: string; comparison: ExecutionComparison | null; passes: boolean[] }[] = [
    { name: 'beállítás nélkül soronként, pontosan', comparison: null, passes: [false, false, false, false, false] },
    { name: 'exact módban ugyanúgy', comparison: { mode: 'exact' }, passes: [false, false, false, false, false] },
    { name: 'tokens módban a szóközök nem számítanak, a számok alakja igen', comparison: { mode: 'tokens' }, passes: [false, true, false, false, false] },
    { name: 'numeric módban a 3.50 és a 3,5 ugyanaz', comparison: { mode: 'numeric' }, passes: [true, true, false, false, false] },
    { name: 'numeric módban tűréssel', comparison: { mode: 'numeric', abs_tol: 0.01 }, passes: [true, true, false, true, false] },
    { name: 'ékezetek nélkül is elfogadva', comparison: { mode: 'exact', ignore_accents: true }, passes: [false, false, true, false, false] },
    { name: 'kis- és nagybetűtől függetlenül', comparison: { mode: 'exact', case_insensitive: true }, passes: [false, false, false, false, true] },
    {
      name: 'minden engedmény együtt',
      comparison: { mode: 'numeric', abs_tol: 0.01, ignore_accents: true, case_insensitive: true },
      passes: [true, true, true, true, true],
    },
  ]

  // A kerelem-kontextus tesztenkent uj, ezert a hookok kozott csak a token es
  // az azonositok maradnak meg: a klienseket minden teszt a sajat apiClient-jebol kepzi.
  let studentToken: string
  let fixture: CodeExerciseFixture

  test.beforeAll(async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    studentToken = (await apiClient.signUp(registration())).token
    fixture = await createCodeExercise(
      admin.client,
      CASES.map(({ stdin, expected_stdout }) => ({ stdin, expected_stdout }))
    )
  })

  test.afterAll(async ({ apiClient }) => {
    await deleteCodeExercise((await adminAccount(apiClient)).client, fixture)
  })

  for (const mode of MODES) {
    test(mode.name, { tag: '@regression' }, async ({ apiClient }) => {
      const admin = await adminAccount(apiClient)
      const client = apiClient.withToken(studentToken)
      await setComparison(admin.client, fixture.exerciseId, mode.comparison)

      const { status, body } = await runSolution(client, { task_id: fixture.exerciseId, language: 'python', source_code: ECHO_PROGRAM })

      expect(status).toBe(200)
      expect(body.results.map((result) => result.passed)).toEqual(mode.passes)
      expect(body.status).toBe(mode.passes.every(Boolean) ? 'passed' : 'failed')
      expect(body).not.toHaveProperty('subtasks')
    })
  }

  test('az elemenkénti összevetés megnevezi az első eltérő elemet, a soronkénti nem', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const client = apiClient.withToken(studentToken)
    const payload = { task_id: fixture.exerciseId, language: 'python', source_code: ECHO_PROGRAM }

    await setComparison(admin.client, fixture.exerciseId, { mode: 'tokens' })
    const tokens = await runSolution(client, payload)
    await setComparison(admin.client, fixture.exerciseId, { mode: 'exact' })
    const exact = await runSolution(client, payload)

    expect(tokens.body.results[0]?.difference).toBe('A(z) 1. elem eltér: ezt kaptuk: „3.50”, ezt vártuk: „3,5”.')
    // Az atmeno tesztesethez nem tartozik elteres.
    expect(tokens.body.results[1]).not.toHaveProperty('difference')
    expect(exact.body.results.some((result) => 'difference' in result)).toBe(false)
  })
})
