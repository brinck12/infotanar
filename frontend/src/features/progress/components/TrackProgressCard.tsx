import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import type { LessonProgressStatus, LessonSummary, TrackProgress } from '../../../types'
import { trackQuery } from '../api'
import { LessonStatusBadge } from './LessonStatusBadge'
import { ProgressBar } from './ProgressBar'

/** Egy képzési ág összesítője; kinyitva modulonként a leckék állapota. */
export function TrackProgressCard({ track, defaultOpen }: { track: TrackProgress; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <li className="rounded-lg border border-slate-800 bg-slate-900 p-5" data-testid="track-progress" data-track={track.slug}>
      <h2 className="text-lg font-semibold text-slate-100">{track.title}</h2>
      <div className="mt-3">
        <ProgressBar label="Teljesített leckék" completed={track.completed} total={track.total} percent={track.percent} />
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="mt-4 text-sm text-sky-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        {open ? 'Leckék elrejtése' : 'Leckék megjelenítése'}
      </button>
      {open && (
        <div id={panelId} className="mt-4">
          <LessonList slug={track.slug} statuses={track.lessons} />
        </div>
      )}
    </li>
  )
}

function LessonList({ slug, statuses }: { slug: string; statuses: TrackProgress['lessons'] }) {
  const structure = useQuery(trackQuery(slug))

  if (structure.isPending) return <p className="text-sm text-slate-400">Leckék betöltése…</p>
  if (structure.isError) return <p className="text-sm text-red-300">{hibaUzenet(structure.error)}</p>

  const statusById = new Map(statuses.map((l) => [l.id, l.status]))

  return (
    <div className="space-y-5">
      {structure.data.modules
        .filter((module) => module.lessons.length > 0)
        .map((module) => (
          <section key={module.id} aria-label={module.title}>
            <h3 className="text-sm font-medium text-slate-300">{module.title}</h3>
            <ul className="mt-2 divide-y divide-slate-800 rounded-lg border border-slate-800">
              {module.lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} status={statusById.get(lesson.id) ?? 'not_started'} />
              ))}
            </ul>
          </section>
        ))}
    </div>
  )
}

function LessonRow({ lesson, status }: { lesson: LessonSummary; status: LessonProgressStatus }) {
  // A lecke a hozzá tartozó első feladatnál folytatható.
  const firstExercise = lesson.exercises[0]

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      {firstExercise ? (
        <Link to={`/feladatok/${firstExercise.id}`} className="text-sm text-slate-200 hover:text-sky-300 hover:underline">
          {lesson.title}
        </Link>
      ) : (
        <span className="text-sm text-slate-300">{lesson.title}</span>
      )}
      <LessonStatusBadge status={status} />
    </li>
  )
}
