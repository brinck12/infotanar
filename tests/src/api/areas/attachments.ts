/**
 * Csatolmanyok: admin feltoltes, lista, torles (admin/exercises/{exercise}/attachments, admin/attachments/{attachment}) es az alairt letoltes.
 *
 * A fajl gazdaja a WP1 csomag: ide kerulnek a terulet segedfuggvenyei. Mindegyik egy
 * `ApiClient`-et kap, es annak nyilvanos metodusaira epul (`get`, `post`, `put`,
 * `patch`, `delete`, `postMultipart`, `getBinary`), igy az ApiClient.ts-t nem kell
 * modositani. Minta: accounts.ts. A valaszok tipusai: ../types/attachments.ts.
 */
import { createHmac } from 'node:crypto'
import { env } from '../../../config/env'
import { TEST_APP_KEY } from '../../../config/web-servers'
import type { ApiClient, ApiResult, BinaryResult, UploadFile } from '../ApiClient'
import type { AdminAttachment, AttachmentRole, DataEnvelope } from '../types'

/** A feltoltes szoveges mezoi; a szerep barmilyen szoveg lehet, hogy a validacio is tesztelheto legyen. */
export interface AttachmentFields {
  role: AttachmentRole | (string & {})
  test_case_id?: number
  name?: string
}

export function listAttachments(admin: ApiClient, exerciseId: number): Promise<ApiResult<DataEnvelope<AdminAttachment[]>>> {
  return admin.get(`admin/exercises/${String(exerciseId)}/attachments`)
}

export function uploadAttachment(
  client: ApiClient,
  exerciseId: number,
  file: UploadFile,
  fields: AttachmentFields
): Promise<ApiResult<DataEnvelope<AdminAttachment>>> {
  return client.postMultipart(`admin/exercises/${String(exerciseId)}/attachments`, { ...fields }, file)
}

export function deleteAttachment(client: ApiClient, attachmentId: number): Promise<ApiResult<null>> {
  return client.delete(`admin/attachments/${String(attachmentId)}`)
}

/** Alairt URL letoltese token nelkul is mukodik: a jogosultsagot az alairas hordozza. */
export function download(client: ApiClient, url: string): Promise<BinaryResult> {
  return client.getBinary(url)
}

/** Ugyanaz az URL elrontott alairassal (az utolso karaktere mas): 403-at kell kapnia. */
export function withTamperedSignature(url: string): string {
  const tampered = new URL(url)
  const signature = tampered.searchParams.get('signature') ?? ''
  tampered.searchParams.set('signature', signature.slice(0, -1) + (signature.endsWith('0') ? '1' : '0'))
  return tampered.toString()
}

/**
 * Ervenyesen alairt DIAK letoltesi URL (admin jelzo nelkul) barmelyik
 * csatolmanyhoz, ugyanugy, ahogy a backend alairja (a relativ utvonal es a
 * lekerdezes HMAC-SHA256-ja az APP_KEY-jel).
 *
 * Az API ilyen URL-t a diaknak tiltott szerepekhez (`input`,
 * `sample_solution`) soha nem ad ki, ezert a teszt maga allitja elo: igy
 * bizonyithato, hogy a letoltes akkor is 404, ha valaki megis hozzajutna egyhez.
 */
export function studentDownloadUrl(attachmentId: number): string {
  const api = new URL(env.API_BASE_URL)
  const expires = Math.floor(Date.now() / 1000) + 600
  const unsigned = `${api.pathname}attachments/${String(attachmentId)}/download?expires=${String(expires)}`
  const signature = createHmac('sha256', TEST_APP_KEY).update(unsigned).digest('hex')

  return `${api.origin}${unsigned}&signature=${signature}`
}
