/**
 * Haladas, adatexport es fiokteles (GET /progress, GET /tasks, POST /lessons/{id}/complete,
 * GET /account/export, DELETE /account).
 *
 * A fajl gazdaja a WP8 csomag. Mindegyik egy `ApiClient`-et kap.
 */
import type { APIRequestContext } from '@playwright/test'
import type { ApiClient, ApiResult } from '../ApiClient'
import { recordEndpointHit } from '../../support/endpointHits'
import type { AccountExportPrivacy, DataEnvelope, ProgressReport, TaskStatusDetail } from '../types'

export function progress(client: ApiClient): Promise<ApiResult<DataEnvelope<ProgressReport>>> {
  return client.get('progress')
}

export function taskStatus(client: ApiClient, id: number): Promise<ApiResult<DataEnvelope<TaskStatusDetail>>> {
  return client.get(`tasks/${String(id)}`)
}

/** A feladatok azonositoi az allapot-szuroju listabol (`status`: solved, attempted vagy unsolved). */
export async function taskIdsWithStatus(client: ApiClient, status: 'solved' | 'attempted' | 'unsolved'): Promise<number[]> {
  const result = await client.get<DataEnvelope<{ id: number }[]>>('tasks', { status })
  if (result.status !== 200) throw new Error(`GET /tasks?status=${status} -> ${String(result.status)}`)

  return result.body.data.map((task) => task.id)
}

export function completeLesson(client: ApiClient, lessonId: number): Promise<ApiResult<DataEnvelope<{ lesson_id: number; status: string }>>> {
  return client.post(`lessons/${String(lessonId)}/complete`, {})
}

export function accountExport(client: ApiClient): Promise<ApiResult<AccountExportPrivacy & Record<string, unknown>>> {
  return client.get('account/export')
}

/**
 * Fiok torlese. A torles torzset var ({password}), amit az `ApiClient.delete` nem kuld,
 * ezert a nyers `request` kontextuson megy; a valasz statuszat adja vissza.
 */
export async function deleteAccount(request: APIRequestContext, token: string, password: string): Promise<number> {
  recordEndpointHit('DELETE', 'account')
  const response = await request.delete('account', { headers: { Authorization: `Bearer ${token}` }, data: { password } })

  return response.status()
}
