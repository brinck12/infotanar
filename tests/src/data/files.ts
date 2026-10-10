import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { UploadFile } from '../api/ApiClient'

const FIXTURE_DIR = path.resolve(__dirname, '../../fixtures/files')

/** Kiterjesztes => a bongeszo altal kuldott MIME-tipus. A backend ebben nem bizik, a tartalmat nezi. */
const MIME_TYPES: Record<string, string> = {
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.html': 'text/html',
  '.css': 'text/css',
  '.txt': 'text/plain',
  '.zip': 'application/zip',
}

/** A fajlnev kiterjesztesehez illo MIME-tipus; ismeretlennel altalanos binaris. */
export function mimeTypeOf(name: string): string {
  return MIME_TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream'
}

/**
 * Egy fixture fajl feltoltheto alakban (`ApiClient.postMultipart`).
 *
 * @param file A fajl neve a fixtures/files mappaban, vagy azon beluli relativ utvonal (pl. `documents/x.docx`).
 * @param uploadAs Milyen neven menjen fel; alapbol a sajat neven. Rossz kiterjesztes tesztelesehez.
 */
export function fixtureFile(file: string, uploadAs: string = path.basename(file)): UploadFile {
  return { name: uploadAs, mimeType: mimeTypeOf(uploadAs), buffer: readFileSync(path.join(FIXTURE_DIR, file)) }
}

/** Memoriaban osszerakott tartalom feltoltheto alakban (pl. generalt zip, tul nagy fajl). */
export function uploadOf(name: string, contents: Buffer | string): UploadFile {
  return { name, mimeType: mimeTypeOf(name), buffer: typeof contents === 'string' ? Buffer.from(contents, 'utf8') : contents }
}
