/**
 * Fajlbeadasok: feltoltes, lista, egy beadas, kezi pontok (exercises/{exercise}/file-submissions, file-submissions/{submission}).
 *
 * A fajl gazdaja a WP3 csomag. Mindegyik egy `ApiClient`-et kap. A valaszok tipusai: ../types/fileTasks.ts.
 */
import type { ApiClient, ApiResult, UploadFile } from '../ApiClient'
import type { DataEnvelope, FileSubmission } from '../types'

/** A WP3 sajat fixture-jei (tests/fixtures/files/spreadsheet/generate.ts). */
export const SHEET_FIXTURES = {
  fullXlsx: 'pw-tabla-teljes.xlsx',
  fullOds: 'pw-tabla-teljes.ods',
  hungarianXlsx: 'pw-tabla-magyar.xlsx',
  stylesOds: 'pw-tabla-stilus.ods',
  formattedColumnOds: 'pw-tabla-formazott-oszlop.ods',
  manyEmptyXlsx: 'pw-tabla-sok-ures.xlsx',
  manyEmptyOds: 'pw-tabla-sok-ures.ods',
  manyRepeatedOds: 'pw-tabla-sok-ismetelt.ods',
} as const

export function uploadFileSubmission(client: ApiClient, exerciseId: number, file: UploadFile): Promise<ApiResult<DataEnvelope<FileSubmission>>> {
  return client.postMultipart(`exercises/${String(exerciseId)}/file-submissions`, {}, file)
}

export function fileSubmissions(client: ApiClient, exerciseId: number): Promise<ApiResult<DataEnvelope<FileSubmission[]>>> {
  return client.get(`exercises/${String(exerciseId)}/file-submissions`)
}

export function fileSubmission(client: ApiClient, id: number): Promise<ApiResult<DataEnvelope<FileSubmission>>> {
  return client.get(`file-submissions/${String(id)}`)
}

/** `marks`: ertekelolap-pont azonositoja => megvan-e (barmi mas ertek a validaciot probalja ki). */
export function saveManualMarks(client: ApiClient, id: number, marks: Record<string, unknown>): Promise<ApiResult<DataEnvelope<FileSubmission>>> {
  return client.put(`file-submissions/${String(id)}/manual`, { marks })
}
