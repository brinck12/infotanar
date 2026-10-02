import { AxiosError } from 'axios'
import type { AdminLesson } from '../api'
import { beginVideoUpload, completeVideoUpload, putVideoPart, videoUploadStatus, type VideoUpload } from './api'

/** Egy darabot ennyiszer próbálunk el, mielőtt a feltöltés megáll (és kézzel folytatható). */
const MAX_PART_ATTEMPTS = 5
const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 15_000

export interface ChunkedUploadOptions {
  signal: AbortSignal
  /** Az eddig elküldött bájtok száma (a folyamatban levő darab részleges haladásával). */
  onProgress: (sentBytes: number, totalBytes: number) => void
  /** Amint megvan a feltöltés azonosítója: a megszakításhoz és a folytatáshoz kell. */
  onStarted: (upload: VideoUpload) => void
  /** Egy korábban megszakadt feltöltés azonosítója: ha a szerver még ismeri, onnan folytatjuk. */
  resumeUploadId?: string
}

/**
 * Videó feltöltése darabokban (#158). A szerver megmondja a darabméretet, a kliens
 * sorban küldi a darabokat; egy sikertelen darabot (hálózati hiba, 5xx) többször,
 * növekvő várakozással újrapróbál. Ha a feltöltés ennek ellenére megáll, a
 * `resumeUploadId`-vel folytatható: a szerver megmondja, mely darabok vannak már meg,
 * azokat nem küldjük újra.
 */
export async function uploadVideoInParts(lessonId: number, file: File, options: ChunkedUploadOptions): Promise<AdminLesson> {
  const upload = (await resumable(file, options.resumeUploadId)) ?? (await beginVideoUpload(lessonId, file))
  options.onStarted(upload)

  const received = new Set(upload.received_parts)
  let confirmedBytes = 0
  for (const part of received) confirmedBytes += partBlob(file, upload, part).size
  options.onProgress(confirmedBytes, file.size)

  async function sendPart(part: number): Promise<void> {
    const bytes = partBlob(file, upload, part)
    await withRetry(options.signal, () =>
      putVideoPart(upload.id, part, bytes, {
        signal: options.signal,
        onProgress: (loaded) => options.onProgress(confirmedBytes + Math.min(loaded, bytes.size), file.size),
      }),
    )
    confirmedBytes += bytes.size
    options.onProgress(confirmedBytes, file.size)
  }

  // A darabok szandekosan egymas utan mennek (egy vonalon egyszerre egy), nem parhuzamosan.
  const missing = Array.from({ length: upload.total_parts }, (_, index) => index + 1).filter((part) => !received.has(part))
  await missing.reduce<Promise<void>>((previous, part) => previous.then(() => sendPart(part)), Promise.resolve())

  return completeVideoUpload(upload.id)
}

/** A folytatható feltöltés, ha a szerver még ismeri és ugyanarról a fájlról szól; különben null. */
async function resumable(file: File, uploadId: string | undefined): Promise<VideoUpload | null> {
  if (uploadId === undefined) return null

  try {
    const upload = await videoUploadStatus(uploadId)
    return upload.filename === file.name && upload.size === file.size ? upload : null
  } catch {
    // Lejárt vagy törölt feltöltés: újrakezdjük.
    return null
  }
}

function partBlob(file: File, upload: VideoUpload, part: number): Blob {
  return file.slice((part - 1) * upload.part_size, part * upload.part_size)
}

/** Hálózati hiba, időtúllépés vagy szerverhiba: érdemes újrapróbálni. A 4xx hiba (pl. 422) végleges. */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false
  if (error.code === 'ERR_CANCELED') return false
  const status = error.response?.status
  return status === undefined || status >= 500 || status === 408 || status === 429
}

async function withRetry(signal: AbortSignal, attempt: () => Promise<void>, tries = 1): Promise<void> {
  try {
    await attempt()
  } catch (error) {
    if (signal.aborted || tries >= MAX_PART_ATTEMPTS || !isRetryable(error)) throw error
    await delay(Math.min(BASE_DELAY_MS * 2 ** (tries - 1), MAX_DELAY_MS), signal)
    return withRetry(signal, attempt, tries + 1)
  }
}

/** Várakozás, ami a megszakításra azonnal véget ér. */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms)
    signal.addEventListener('abort', done, { once: true })

    function done() {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
  })
}
