/**
 * Tipusos feladatok: a diak reszletes nezete (tasks/{id}) a fajtafuggo
 * mezokkel, es a feladat admin CRUD-ja (admin/exercises) a `kind`, `spec` es
 * `comparison` mezokkel.
 *
 * A fajl gazdaja a WP1 csomag. Minden fuggveny egy `ApiClient`-et kap, es
 * annak nyilvanos metodusaira epul. Tipusok: ../types/typedTasks.ts es
 * ../types/attachments.ts.
 */
import type { ApiClient, ApiResult } from '../ApiClient'
import type { AdminExercise, AdminExercisePayload, AdminTestCase, DataEnvelope, TypedTaskDetail } from '../types'

export function typedTask(client: ApiClient, id: number): Promise<ApiResult<DataEnvelope<TypedTaskDetail>>> {
  return client.get(`tasks/${String(id)}`)
}

export function adminExercise(admin: ApiClient, id: number): Promise<ApiResult<DataEnvelope<AdminExercise>>> {
  return admin.get(`admin/exercises/${String(id)}`)
}

export function createExercise(client: ApiClient, payload: AdminExercisePayload): Promise<ApiResult<DataEnvelope<AdminExercise>>> {
  return client.post('admin/exercises', payload)
}

/** PATCH: csak a megadott mezok valtoznak. */
export function updateExercise(admin: ApiClient, id: number, payload: AdminExercisePayload): Promise<ApiResult<DataEnvelope<AdminExercise>>> {
  return admin.patch(`admin/exercises/${String(id)}`, payload)
}

export function deleteExercise(admin: ApiClient, id: number): Promise<ApiResult<null>> {
  return admin.delete(`admin/exercises/${String(id)}`)
}

export function testCases(admin: ApiClient, exerciseId: number): Promise<ApiResult<DataEnvelope<AdminTestCase[]>>> {
  return admin.get(`admin/exercises/${String(exerciseId)}/test-cases`)
}

export function createTestCase(
  admin: ApiClient,
  exerciseId: number,
  payload: Pick<AdminTestCase, 'stdin' | 'expected_stdout' | 'is_hidden'>
): Promise<ApiResult<DataEnvelope<AdminTestCase>>> {
  return admin.post(`admin/exercises/${String(exerciseId)}/test-cases`, payload)
}

export function deleteTestCase(admin: ApiClient, testCaseId: number): Promise<ApiResult<null>> {
  return admin.delete(`admin/test-cases/${String(testCaseId)}`)
}

/** Egy teszteset eredmenye a mintamegoldasos ellenorzesben. */
export interface VerifyTestRow {
  test_case_id: number | null
  hidden: boolean
  passed: boolean
  verdict: string
  verdict_label: string
  time: string | null
  message: string | null
}

export interface VerifyRun {
  language: string
  passed: boolean
  verdict: string
  verdict_label: string
  score: number
  max_score: number
  tests: VerifyTestRow[]
}

/** `POST admin/exercises/{id}/verify`: a feladat lefut a sajat mintamegoldasan; nem tarol semmit. */
export interface ExerciseVerification {
  exercise_id: number
  title: string
  kind: string
  status: 'passed' | 'failed' | 'skipped'
  message: string | null
  runs: VerifyRun[]
}

export function verifyExercise(client: ApiClient, id: number): Promise<ApiResult<DataEnvelope<ExerciseVerification>>> {
  return client.post(`admin/exercises/${String(id)}/verify`, {})
}
