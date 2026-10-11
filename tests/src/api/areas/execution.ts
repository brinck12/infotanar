/**
 * Kodfuttatas: futtatas es beadas az uj mezokkel (reszfeladatok, elteres),
 * sajat kodfeladat letrehozasa az admin API-n, es az osszehasonlitasi mod
 * beallitasa.
 *
 * A fajl gazdaja a WP2 csomag. Mindegyik fuggveny egy `ApiClient`-et kap, es
 * annak nyilvanos metodusaira epul. A valaszok tipusai: ../types/execution.ts.
 */
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { env } from '../../../config/env'
import type { ApiClient, ApiResult, RunPayload } from '../ApiClient'
import type { DataEnvelope, ExecutionComparison, ExecutionRunResponse, ExecutionSubmissionResponse } from '../types'

/** `POST /run` az uj mezoket is ismero valasztipussal. */
export function runSolution(client: ApiClient, payload: RunPayload): Promise<ApiResult<ExecutionRunResponse>> {
  return client.post<ExecutionRunResponse>('run', payload)
}

/** `POST /submissions` az uj mezoket is ismero valasztipussal. */
export function submitSolution(client: ApiClient, payload: RunPayload): Promise<ApiResult<ExecutionSubmissionResponse>> {
  return client.post<ExecutionSubmissionResponse>('submissions', payload)
}

export interface TestCaseInput {
  stdin: string
  expected_stdout: string
  is_hidden?: boolean
}

/** Egy tesztben letrehozott kodfeladat a szuleivel egyutt, hogy a vegen torolheto legyen. */
export interface CodeExerciseFixture {
  moduleId: number
  lessonId: number
  exerciseId: number
  /** A tesztesetek azonositoi a megadas sorrendjeben. */
  testCaseIds: number[]
}

interface Identified {
  id: number
}

async function created(result: Promise<ApiResult<DataEnvelope<Identified>>>, what: string): Promise<number> {
  const response = await result
  if (response.status !== 201) throw new Error(`${what} letrehozasa sikertelen (${String(response.status)}): ${JSON.stringify(response.body)}`)
  return response.body.data.id
}

/** Teszteset felvetele egy feladathoz az admin API-n; az azonositojat adja vissza. */
export function addTestCase(admin: ApiClient, exerciseId: number, testCase: TestCaseInput): Promise<number> {
  return created(
    admin.post(`admin/exercises/${String(exerciseId)}/test-cases`, { is_hidden: false, ...testCase }),
    'A teszteset'
  )
}

/**
 * Publikalt Python kodfeladat ingyenes leckeben, sajat modulban: igy a
 * fixture temakorok feladatszama nem valtozik. A teszt vegen a
 * `deleteCodeExercise` eltunteti (csak ha nincs hozza beadas: a tesztek
 * ezert futtatnak rajta, es nem adnak be).
 */
export async function createCodeExercise(admin: ApiClient, testCases: TestCaseInput[]): Promise<CodeExerciseFixture> {
  const suffix = randomUUID().slice(0, 8)

  const tracks = await admin.get<DataEnvelope<Identified[]>>('admin/tracks')
  const trackId = tracks.body.data[0]?.id
  if (trackId === undefined) throw new Error('Nincs track a fixture adatbazisban')

  const moduleId = await created(
    admin.post('admin/modules', { track_id: trackId, slug: `pw-futtatas-${suffix}`, title: `PW teszt futtatás ${suffix}` }),
    'A modul'
  )
  const lessonId = await created(
    admin.post('admin/lessons', { module_id: moduleId, slug: `pw-futtatas-${suffix}`, title: `PW teszt futtatás ${suffix}`, is_free: true, is_published: true }),
    'A lecke'
  )
  const exerciseId = await created(
    admin.post('admin/exercises', {
      lesson_id: lessonId,
      title: `PW teszt: Összehasonlítás ${suffix}`,
      description: 'Playwright API teszt fixture — nem valodi feladat.',
      level: 'kozep',
      difficulty: 1,
      allowed_languages: ['python'],
    }),
    'A feladat'
  )

  const testCaseIds: number[] = []
  for (const testCase of testCases) {
    testCaseIds.push(await addTestCase(admin, exerciseId, testCase))
  }

  // Publikalni csak lathato tesztesettel lehet, ezert a vegen.
  const published = await admin.patch(`admin/exercises/${String(exerciseId)}`, { is_published: true })
  if (!published.ok) throw new Error(`A feladat publikalasa sikertelen (${String(published.status)})`)

  return { moduleId, lessonId, exerciseId, testCaseIds }
}

/** A `createCodeExercise` altal letrehozott feladat, lecke es modul torlese. */
export async function deleteCodeExercise(admin: ApiClient, fixture: CodeExerciseFixture): Promise<void> {
  for (const resource of [`exercises/${String(fixture.exerciseId)}`, `lessons/${String(fixture.lessonId)}`, `modules/${String(fixture.moduleId)}`]) {
    const deleted = await admin.delete(`admin/${resource}`)
    if (deleted.status !== 204) throw new Error(`A torles sikertelen: admin/${resource} (${String(deleted.status)})`)
  }
}

/**
 * A feladat osszehasonlitasi modjanak beallitasa (`null` = alapertelmezes).
 *
 * Az admin API-n megy (`PATCH admin/exercises/{id}`), amint az ismeri a
 * `comparison` mezot (WP1 csomag). Amig nem ismeri, a mezot szo nelkul
 * eldobja: ilyenkor az erteket kozvetlenul a teszt-adatbazisba irjuk
 * (`storeComparisonDirectly`). A WP1 beolvasztasa utan az a fuggveny es ez az
 * ag torolheto.
 */
export async function setComparison(admin: ApiClient, exerciseId: number, comparison: ExecutionComparison | null): Promise<void> {
  const patched = await admin.patch<DataEnvelope<{ comparison?: unknown }>>(`admin/exercises/${String(exerciseId)}`, { comparison })
  if (!patched.ok) throw new Error(`Az osszehasonlitasi mod beallitasa sikertelen (${String(patched.status)}): ${JSON.stringify(patched.body)}`)

  if (!('comparison' in patched.body.data)) storeComparisonDirectly(exerciseId, comparison)
}

/**
 * Atmeneti megoldas, amig az admin API nem irja a `comparison` oszlopot: a
 * helyben futo teszt-backend adatbazisaba ir, ugyanazzal a kapcsolattal,
 * amivel a Playwright a backendet inditja (config/web-servers.ts).
 */
function storeComparisonDirectly(exerciseId: number, comparison: ExecutionComparison | null): void {
  if (!env.START_WEB_SERVERS) throw new Error('Az osszehasonlitasi mod csak helyben futo teszt-backenden irhato kozvetlenul')

  const payload = Buffer.from(JSON.stringify(comparison)).toString('base64')
  const code = [
    "require 'vendor/autoload.php';",
    "$app = require 'bootstrap/app.php';",
    '$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();',
    `App\\Models\\Exercise::query()->findOrFail(${String(exerciseId)})->update(['comparison' => json_decode(base64_decode('${payload}'), true)]);`,
  ].join(' ')

  const database: Record<string, string> = env.API_DATABASE_URL
    ? { DB_CONNECTION: 'mysql', DB_URL: env.API_DATABASE_URL }
    : { DB_CONNECTION: 'sqlite', DB_DATABASE: 'database/testing.sqlite' }

  execFileSync('php', ['-r', code], {
    cwd: path.resolve(__dirname, '../../../../backend'),
    env: { ...process.env, APP_ENV: 'testing', ...database },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}
