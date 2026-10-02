import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type DragEvent } from 'react'
import { hibaUzenet } from '../../../../shared/api/errors'
import { formatFileSize } from '../../../../shared/domain/fileSize'
import { Alert } from '../../../../shared/ui/Form'
import { invalidateCatalog, type AdminLesson, type LessonMediaFile } from '../api'
import { removeLessonCaptions, removeLessonVideo, uploadLessonCaptions, videoPreviewUrl } from '../media/api'
import { useVideoUpload, type VideoUploadState } from '../media/useVideoUpload'

const dateTime = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' })

/**
 * A lecke videója és felirata (#158): feltöltés, csere, eltávolítás szerver-hozzáférés nélkül.
 * A videó darabokban megy, megszakadás után onnan folytatható; a tényleges fájl típusát a
 * szerver a tartalomból állapítja meg, nem a kiterjesztésből.
 */
export function LessonMediaManager({ lesson }: { lesson: AdminLesson }) {
  return (
    <div className="space-y-8" data-testid="lesson-media">
      <VideoPanel lesson={lesson} />
      <CaptionsPanel lesson={lesson} />
    </div>
  )
}

function VideoPanel({ lesson }: { lesson: AdminLesson }) {
  const queryClient = useQueryClient()
  const upload = useVideoUpload(lesson.id)
  const refresh = () => invalidateCatalog(queryClient)
  const preview = useMutation({ mutationFn: () => videoPreviewUrl(lesson.id) })
  const remove = useMutation({
    mutationFn: () => removeLessonVideo(lesson.id),
    onSuccess: () => preview.reset(),
    onSettled: refresh,
  })
  const video = lesson.video
  const busy = upload.state.phase === 'uploading'

  return (
    <section aria-label="Videó" className="space-y-3">
      <h3 className="text-sm font-medium text-slate-200">Videó</h3>

      <CurrentFile media={video} kind="videó" />

      {preview.data && (
        <video src={preview.data.url} controls preload="metadata" aria-label="Videó előnézete" className="max-h-80 w-full rounded-lg bg-black">
          {/* Mint a diák oldali lejátszónál: ha a leckének nincs felirata, a sáv üres marad. */}
          <track kind="captions" srcLang="hu" label="Magyar" src={preview.data.captions_url ?? undefined} default={preview.data.captions_url !== null} />
        </video>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {video?.exists && !preview.data && (
          <button
            type="button"
            disabled={preview.isPending}
            onClick={() => preview.mutate()}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-100 hover:bg-slate-700 disabled:opacity-60"
          >
            Előnézet
          </button>
        )}
        {video?.path && <RemoveButton label="videó" busy={remove.isPending || busy} onConfirm={() => remove.mutate()} />}
      </div>

      {(preview.isError || remove.isError) && <Alert kind="error">{hibaUzenet(preview.error ?? remove.error)}</Alert>}

      <UploadControl state={upload.state} replacing={video?.path != null} onFile={(file) => void upload.start(file)} onCancel={() => void upload.cancel()} onRetry={upload.retry} />

      {upload.state.phase === 'idle' && upload.hasPendingUpload && (
        <p className="text-xs text-slate-400" data-testid="pending-upload-hint">
          Megszakadt feltöltés maradt ehhez a leckéhez. Válaszd ki újra ugyanazt a fájlt, és onnan folytatjuk, ahol abbamaradt.
        </p>
      )}
    </section>
  )
}

function CaptionsPanel({ lesson }: { lesson: AdminLesson }) {
  const queryClient = useQueryClient()
  const refresh = () => invalidateCatalog(queryClient)
  const upload = useMutation({ mutationFn: (file: File) => uploadLessonCaptions(lesson.id, file), onSettled: refresh })
  const remove = useMutation({ mutationFn: () => removeLessonCaptions(lesson.id), onSettled: refresh })
  const inputRef = useRef<HTMLInputElement>(null)
  const captions = lesson.captions

  return (
    <section aria-label="Felirat" className="space-y-3">
      <h3 className="text-sm font-medium text-slate-200">Felirat (WebVTT)</h3>

      <CurrentFile media={captions} kind="felirat" />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-100 focus-within:ring-2 focus-within:ring-sky-400 hover:bg-slate-700">
          {captions?.path ? 'Felirat cseréje' : 'Felirat feltöltése'}
          <input
            ref={inputRef}
            type="file"
            accept=".vtt,text/vtt"
            aria-label="Felirat fájl (.vtt)"
            className="sr-only"
            disabled={upload.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload.mutate(file)
              // Ugyanaz a fájl újra kiválasztható legyen (pl. javítás után).
              if (inputRef.current) inputRef.current.value = ''
            }}
          />
        </label>
        {captions?.path && <RemoveButton label="felirat" busy={remove.isPending} onConfirm={() => remove.mutate()} />}
        {upload.isPending && <span className="text-slate-400">Feltöltés…</span>}
      </div>

      {(upload.isError || remove.isError) && <Alert kind="error">{hibaUzenet(upload.error ?? remove.error)}</Alert>}
    </section>
  )
}

/** A leckéhez most tartozó fájl; ha az útvonal "lelóg", figyelmeztet. */
function CurrentFile({ media, kind }: { media: LessonMediaFile | undefined; kind: string }) {
  if (!media?.path) return <p className="text-sm text-slate-400">Nincs {kind} feltöltve.</p>

  if (!media.exists) {
    return (
      <Alert kind="error">
        A hivatkozott {kind} nem található a tárolón ({media.path}). A diákok hibát kapnak, amíg nem töltesz fel újat, vagy nem javítod az útvonalat.
      </Alert>
    )
  }

  return (
    <p className="text-sm text-slate-300" data-testid={`${kind}-info`}>
      <span className="font-mono text-xs text-slate-200">{media.path}</span>
      {media.size !== null && <span className="ml-2 text-slate-400">{formatFileSize(media.size)}</span>}
      {media.uploaded_at && <span className="ml-2 text-slate-400">· {dateTime.format(new Date(media.uploaded_at))}</span>}
    </p>
  )
}

function UploadControl({
  state,
  replacing,
  onFile,
  onCancel,
  onRetry,
}: {
  state: VideoUploadState
  replacing: boolean
  onFile: (file: File) => void
  onCancel: () => void
  onRetry: () => void
}) {
  const [dragging, setDragging] = useState(false)

  if (state.phase === 'uploading') {
    const percent = Math.min(100, Math.floor((state.sentBytes / state.totalBytes) * 100))
    return (
      <div className="space-y-2" data-testid="upload-progress">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>{state.filename}</span>
          <span className="font-mono text-xs">
            {percent}% · {formatFileSize(state.sentBytes)} / {formatFileSize(state.totalBytes)}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Feltöltés"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2 overflow-hidden rounded-full bg-slate-800"
        >
          <div className="h-full bg-sky-500 transition-[width]" style={{ width: `${percent}%` }} />
        </div>
        <button type="button" onClick={onCancel} className="rounded px-2 py-1 text-sm text-slate-300 hover:bg-slate-800">
          Megszakítás
        </button>
      </div>
    )
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="space-y-2">
      {state.phase === 'failed' && (
        <div role="alert" data-testid="upload-failed" className="space-y-2 rounded-lg border border-red-900 bg-red-950/60 p-3 text-sm text-red-200">
          <p>
            A(z) „{state.filename}” feltöltése megállt: {state.message}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onRetry} className="rounded bg-red-800 px-3 py-1 text-white hover:bg-red-700">
              Folytatás
            </button>
            <button type="button" onClick={onCancel} className="rounded px-3 py-1 text-red-100 hover:bg-red-900">
              Elvetés
            </button>
          </div>
        </div>
      )}

      {/* A húzás csak kiegészítés: a fájlválasztó (a címke) billentyűzettel is használható. */}
      <div role="presentation" onDragOver={onDragOver} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
        <label
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-slate-300 focus-within:ring-2 focus-within:ring-sky-400 ${
            dragging ? 'border-sky-400 bg-sky-950/40' : 'border-slate-700 hover:bg-slate-900'
          }`}
        >
          <span>{replacing ? 'Húzd ide az új videót a cseréhez' : 'Húzd ide a videót'}, vagy kattints a kiválasztáshoz</span>
          <span className="text-xs text-slate-400">MP4 vagy WebM</span>
          <input
            type="file"
            accept="video/mp4,video/webm"
            aria-label="Videó fájl"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFile(file)
              e.target.value = ''
            }}
          />
        </label>
      </div>
    </div>
  )
}

function RemoveButton({ label, busy, onConfirm }: { label: string; busy: boolean; onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false)

  return confirming ? (
    <span role="group" aria-label={`A ${label} eltávolításának megerősítése`} className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => {
          setConfirming(false)
          onConfirm()
        }}
        className="rounded bg-red-800 px-3 py-1.5 text-white hover:bg-red-700"
      >
        Eltávolítás
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="rounded px-3 py-1.5 text-slate-300 hover:bg-slate-800">
        Mégse
      </button>
    </span>
  ) : (
    <button type="button" disabled={busy} onClick={() => setConfirming(true)} className="rounded px-3 py-1.5 text-red-300 hover:bg-red-950 disabled:opacity-50">
      {label[0]?.toUpperCase()}
      {label.slice(1)} eltávolítása
    </button>
  )
}
