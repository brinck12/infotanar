/**
 * Ertekelolap: admin lista, letrehozas, modositas, torles, sorrend es az ertekelolap-proba (admin/exercises/{exercise}/rubric-items, rubric-check).
 *
 * A fajl gazdaja a WP3 csomag. Mindegyik egy `ApiClient`-et kap. A valaszok tipusai: ../types/rubrics.ts.
 */
import type { ApiClient, ApiResult, UploadFile } from '../ApiClient'
import type { AdminRubricItem, DataEnvelope, FileSubmission, RubricItemInput } from '../types'

/** Ervenyes, automatikus pont; a felulirt mezokkel masik valtozat keszitheto. */
export function rubricItemInput(overrides: Partial<RubricItemInput> = {}): RubricItemInput {
  return {
    label: 'PW teszt pont',
    group: 'PW csoport',
    check_type: 'cell_value',
    property: 'Munka1!A1',
    expected: '10',
    points: 1,
    mode: 'auto',
    hint: 'PW tipp',
    ...overrides,
  }
}

export function rubricItems(client: ApiClient, exerciseId: number): Promise<ApiResult<DataEnvelope<AdminRubricItem[]>>> {
  return client.get(`admin/exercises/${String(exerciseId)}/rubric-items`)
}

export function createRubricItem(client: ApiClient, exerciseId: number, input: unknown): Promise<ApiResult<DataEnvelope<AdminRubricItem>>> {
  return client.post(`admin/exercises/${String(exerciseId)}/rubric-items`, input)
}

export function updateRubricItem(client: ApiClient, id: number, input: unknown): Promise<ApiResult<DataEnvelope<AdminRubricItem>>> {
  return client.put(`admin/rubric-items/${String(id)}`, input)
}

export function deleteRubricItem(client: ApiClient, id: number): Promise<ApiResult<null>> {
  return client.delete(`admin/rubric-items/${String(id)}`)
}

export function reorderRubricItems(client: ApiClient, exerciseId: number, ids: number[]): Promise<ApiResult<null>> {
  return client.put(`admin/exercises/${String(exerciseId)}/rubric-items/order`, { ids })
}

/** Ertekelolap-proba: fajl nelkul a mintamegoldassal. */
export function rubricCheck(client: ApiClient, exerciseId: number, file?: UploadFile): Promise<ApiResult<DataEnvelope<FileSubmission>>> {
  return client.postMultipart(`admin/exercises/${String(exerciseId)}/rubric-check`, {}, file)
}
