import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { hibaUzenet } from '../../../../shared/api/errors'
import { invalidateCatalog } from '../api'
import { abortVideoUpload } from './api'
import { uploadVideoInParts } from './chunkedUpload'

export type VideoUploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; filename: string; sentBytes: number; totalBytes: number }
  /** Megállt (hiba vagy megszakadt kapcsolat): `retry` onnan folytatja, ahol abbamaradt. */
  | { phase: 'failed'; filename: string; message: string }

interface PendingUpload {
  uploadId: string
  filename: string
  size: number
}

const storageKey = (lessonId: number) => `infotanar.videoUpload.${lessonId}`

function readPending(lessonId: number): PendingUpload | null {
  try {
    const raw = localStorage.getItem(storageKey(lessonId))
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    const candidate = parsed as Partial<PendingUpload> | null
    return candidate && typeof candidate.uploadId === 'string' && typeof candidate.filename === 'string' && typeof candidate.size === 'number'
      ? { uploadId: candidate.uploadId, filename: candidate.filename, size: candidate.size }
      : null
  } catch {
    return null
  }
}

function writePending(lessonId: number, pending: PendingUpload | null): void {
  try {
    if (pending) localStorage.setItem(storageKey(lessonId), JSON.stringify(pending))
    else localStorage.removeItem(storageKey(lessonId))
  } catch {
    // Tiltott tárhely: a folytatás csak ebben a lapban működik.
  }
}

/**
 * Egy lecke videójának feltöltése (#158): indítás, megszakítás, folytatás. A megszakadt feltöltés
 * azonosítóját a böngésző megjegyzi, így lapfrissítés után is folytatható: ugyanazt a fájlt újra
 * kiválasztva a szerver megmondja, mely darabok vannak meg, és csak a többit küldjük el.
 */
export function useVideoUpload(lessonId: number) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<VideoUploadState>({ phase: 'idle' })
  const controller = useRef<AbortController | null>(null)
  const lastFile = useRef<File | null>(null)

  const run = useCallback(
    async (file: File) => {
      lastFile.current = file
      const abort = new AbortController()
      controller.current = abort
      const pending = readPending(lessonId)
      const resumeUploadId = pending?.filename === file.name && pending.size === file.size ? pending.uploadId : undefined

      setState({ phase: 'uploading', filename: file.name, sentBytes: 0, totalBytes: file.size })
      try {
        await uploadVideoInParts(lessonId, file, {
          signal: abort.signal,
          resumeUploadId,
          onStarted: (upload) => writePending(lessonId, { uploadId: upload.id, filename: file.name, size: file.size }),
          onProgress: (sentBytes, totalBytes) => setState({ phase: 'uploading', filename: file.name, sentBytes, totalBytes }),
        })
        writePending(lessonId, null)
        lastFile.current = null
        setState({ phase: 'idle' })
        await invalidateCatalog(queryClient)
      } catch (error) {
        // A megszakítást a `cancel` kezeli, itt nincs mit jelezni.
        if (abort.signal.aborted) return
        setState({ phase: 'failed', filename: file.name, message: hibaUzenet(error) })
      }
    },
    [lessonId, queryClient],
  )

  const cancel = useCallback(async () => {
    controller.current?.abort()
    const pending = readPending(lessonId)
    writePending(lessonId, null)
    lastFile.current = null
    setState({ phase: 'idle' })
    if (pending) {
      try {
        await abortVideoUpload(pending.uploadId)
      } catch {
        // Ha a szerver nem érhető el, a felbehagyott darabokat az ütemezett takarítás törli.
      }
    }
  }, [lessonId])

  const retry = useCallback(() => {
    if (lastFile.current) void run(lastFile.current)
  }, [run])

  return { state, start: run, cancel, retry, hasPendingUpload: readPending(lessonId) !== null }
}
