import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { hibaUzenet } from '../../../shared/api/errors'
import { usePersistentState } from '../../../shared/hooks/usePersistentState'
import type { TaskLesson } from '../../../types'
import { lessonVideo } from '../api'

const RATES = [0.75, 1, 1.25, 1.5, 2] as const

function isRate(value: unknown): value is number {
  return typeof value === 'number' && (RATES as readonly number[]).includes(value)
}

/**
 * A lecke videója a feladatleírás felett (#34). A natív vezérlők adják a
 * tekerést és a teljes képernyőt; a lejátszási sebesség külön, minden
 * böngészőben elérhető gombsorral állítható, és megmarad.
 *
 * A lejátszási URL aláírt és rövid életű: ha lejár (pl. hosszú szünet
 * után tekerésnél), új URL-t kérünk, és ugyanonnan folytatjuk.
 */
export function LessonVideo({ lesson }: { lesson: TaskLesson }) {
  if (!lesson.has_video) {
    return (
      <p
        data-testid="lesson-video-placeholder"
        className="rounded-lg border border-dashed border-slate-800 px-4 py-3 text-sm text-slate-500"
      >
        Ehhez a leckéhez még nem készült videós magyarázat.
      </p>
    )
  }

  return <Player lessonId={lesson.id} title={lesson.title} />
}

function Player({ lessonId, title }: { lessonId: number; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const resumeAt = useRef<{ time: number; playing: boolean } | null>(null)
  // Az utolsó ismert pozíció: hibánál a videóelem már 0-ra állhat vissza.
  const lastPosition = useRef({ time: 0, playing: false })
  const [rate, setRate] = usePersistentState('infotanar.video.rate', 1, isRate)

  const source = useQuery({
    queryKey: ['lesson-video', lessonId],
    queryFn: ({ signal }) => lessonVideo(lessonId, signal),
    // Az URL-t a lejárata előtt nem kérjük újra; ablakfókuszra sem (a lejátszás megszakadna).
    staleTime: 20 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  function onLoadedMetadata() {
    if (videoRef.current) videoRef.current.playbackRate = rate
    applyResume()
  }

  /** URL-csere után ugyanonnan folytatjuk, amint a média tekerhető (metaadat vagy canplay). */
  function applyResume() {
    const video = videoRef.current
    const resume = resumeAt.current
    if (!video || !resume || video.seekable.length === 0) return
    resumeAt.current = null
    video.currentTime = resume.time
    if (resume.playing) void video.play().catch(() => undefined)
  }

  function onError() {
    const video = videoRef.current
    // Egyszer próbálunk új URL-lel (lejárt aláírás); ha az is hibás, marad a hibaüzenet.
    if (!video || resumeAt.current) return
    resumeAt.current = { ...lastPosition.current }
    void source.refetch()
  }

  function changeRate(next: number) {
    setRate(next)
    if (videoRef.current) videoRef.current.playbackRate = next
  }

  return (
    <figure className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900" data-testid="lesson-video">
      {source.isError ? (
        <p role="alert" className="p-4 text-sm text-red-300">
          {hibaUzenet(source.error)}
        </p>
      ) : (
        <div className="aspect-video bg-black">
          {source.data && (
            // A leckékhez még nincs felirat (WebVTT); a bevezetése: #111. Addig tudatos kivétel.
            // oxlint-disable-next-line jsx-a11y/media-has-caption
            <video
              ref={videoRef}
              key={source.data.url}
              src={source.data.url}
              controls
              controlsList="nodownload"
              preload="metadata"
              playsInline
              onLoadedMetadata={onLoadedMetadata}
              onCanPlay={applyResume}
              onTimeUpdate={(e) => {
                const video = e.currentTarget
                // Forrásváltáskor/hibánál a lejátszó 0-ra állva is küld timeupdate-et; azt nem jegyezzük meg.
                if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
                  lastPosition.current = { time: video.currentTime, playing: !video.paused }
                }
              }}
              onError={onError}
              aria-label={`Videós magyarázat: ${title}`}
              className="h-full w-full"
            >
              A böngésződ nem támogatja a videólejátszást.
            </video>
          )}
        </div>
      )}
      <figcaption className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-slate-400">
        <span>Videós magyarázat</span>
        <span role="group" aria-label="Lejátszási sebesség" className="flex gap-1">
          {RATES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={rate === option}
              onClick={() => changeRate(option)}
              className={`rounded px-2 py-0.5 tabular-nums transition ${
                rate === option ? 'bg-sky-800 text-sky-100' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {option.toLocaleString('hu-HU')}×
            </button>
          ))}
        </span>
      </figcaption>
    </figure>
  )
}
