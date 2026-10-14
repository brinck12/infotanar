/**
 * Gyakorlo vizsgak: lista, reszletek, probalkozas inditasa, reszfajl feltoltese, beadas, eredmeny, es az admin vizsgaszerkeszto.
 *
 * A fajl gazdaja a WP6 csomag. Mindegyik egy `ApiClient`-et kap, es annak nyilvanos
 * metodusaira epul (`get`, `post`, `put`, `delete`, `postMultipart`). A valaszok
 * tipusai: ../types/exams.ts.
 */
import type { ApiClient, ApiResult, UploadFile } from '../ApiClient'
import type {
  AdminExam,
  AdminExamPartPayload,
  AdminExamPayload,
  AdminAttachment,
  DataEnvelope,
  ExamAttempt,
  ExamDetail,
  ExamResult,
  ExamSummary,
} from '../types'

export function listExams(client: ApiClient): Promise<ApiResult<DataEnvelope<ExamSummary[]>>> {
  return client.get('exams')
}

export function examDetail(client: ApiClient, examId: number): Promise<ApiResult<DataEnvelope<ExamDetail>>> {
  return client.get(`exams/${String(examId)}`)
}

/** A mod szandekosan barmilyen string lehet, hogy a validacio is tesztelheto legyen. */
export function startAttempt(client: ApiClient, examId: number, mode: string): Promise<ApiResult<DataEnvelope<ExamAttempt>>> {
  return client.post(`exams/${String(examId)}/attempts`, { mode })
}

export function attempt(client: ApiClient, attemptId: number): Promise<ApiResult<DataEnvelope<ExamAttempt>>> {
  return client.get(`exam-attempts/${String(attemptId)}`)
}

export function uploadPartFile(client: ApiClient, attemptId: number, partId: number, file?: UploadFile): Promise<ApiResult<DataEnvelope<ExamAttempt>>> {
  return client.postMultipart(`exam-attempts/${String(attemptId)}/parts/${String(partId)}/file`, {}, file)
}

export function submitAttempt(client: ApiClient, attemptId: number): Promise<ApiResult<DataEnvelope<ExamAttempt>>> {
  return client.post(`exam-attempts/${String(attemptId)}/submit`, {})
}

export function attemptResult(client: ApiClient, attemptId: number): Promise<ApiResult<DataEnvelope<ExamResult>>> {
  return client.get(`exam-attempts/${String(attemptId)}/result`)
}

export function adminExams(admin: ApiClient): Promise<ApiResult<DataEnvelope<AdminExam[]>>> {
  return admin.get('admin/exams')
}

export function adminExam(admin: ApiClient, examId: number): Promise<ApiResult<DataEnvelope<AdminExam>>> {
  return admin.get(`admin/exams/${String(examId)}`)
}

/** Egy ervenyes, kozzetetlen vizsga torzse; az `overrides` felulirja, ami kell. */
export function examPayload(overrides: Partial<Record<keyof AdminExamPayload, unknown>> = {}): AdminExamPayload {
  return { title: 'PW szerkesztett vizsga', level: 'kozep', minutes: 30, points: 10, is_published: false, timed_mode: true, ...overrides } as AdminExamPayload
}

export function createAdminExam(admin: ApiClient, payload: object): Promise<ApiResult<DataEnvelope<AdminExam>>> {
  return admin.post('admin/exams', payload)
}

export function updateAdminExam(admin: ApiClient, examId: number, payload: object): Promise<ApiResult<DataEnvelope<AdminExam>>> {
  return admin.put(`admin/exams/${String(examId)}`, payload)
}

export function addAdminExamPart(admin: ApiClient, examId: number, payload: Partial<AdminExamPartPayload> & Record<string, unknown>): Promise<ApiResult<DataEnvelope<AdminExam>>> {
  return admin.post(`admin/exams/${String(examId)}/parts`, payload)
}

export function removeAdminExamPart(admin: ApiClient, partId: number): Promise<ApiResult<null>> {
  return admin.delete(`admin/exam-parts/${String(partId)}`)
}

export function reorderAdminExamParts(admin: ApiClient, examId: number, ids: unknown): Promise<ApiResult<null>> {
  return admin.put(`admin/exams/${String(examId)}/parts/order`, { ids })
}

export function uploadExamZip(admin: ApiClient, examId: number, file?: UploadFile): Promise<ApiResult<DataEnvelope<AdminAttachment>>> {
  return admin.postMultipart(`admin/exams/${String(examId)}/attachments`, { role: 'source_zip' }, file)
}
