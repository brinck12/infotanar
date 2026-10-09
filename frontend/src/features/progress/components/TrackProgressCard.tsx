import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { LESSON_STATUS_LABEL } from '../../../shared/domain/labels'
import { Badge, type BadgeKind } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import { Tiles } from '../../../shared/ui/Progress'
import { Skeleton } from '../../../shared/ui/States'
import { CardTitle } from '../../../shared/ui/Text'
import type { LessonProgressStatus, LessonSummary, TrackProgress } from '../../../types'
import { trackQuery } from '../../catalog/api'

const STATUS_BADGE: Readonly<Record<LessonProgressStatus, BadgeKind>> = {
  completed: 'ok',
  in_progress: 'neutral',
  not_started: 'draft',
}

/** Egy lecke állapota: a szín mellett mindig szöveg is. */
export function LessonStatusBadge({ status }: { status: LessonProgressStatus }) {
  return (
    <span data-testid="lesson-status" data-status={status}>
      <Badge kind={STATUS_BADGE[status]}>{LESSON_STATUS_LABEL[status]}</Badge>
    </span>
  )
}

/** Egy képzési ág összesítője; kinyitva modulonként a leckék állapota. */
export function TrackProgressCard({ track, defaultOpen }: { track: TrackProgress; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <Panel as="li" data-testid="track-progress" data-track={track.slug}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <CardTitle as="h3">
          <Link to={`/tanulasi-ut/${track.slug}`} className="text-ink no-underline hover:underline">
            {track.title}
          </Link>
        </CardTitle>
        <span className="text-15 text-ink-soft">
          {track.completed} / {track.total} lecke, {track.percent}%
        </span>
      </div>
      <Tiles done={track.completed} total={track.total} className="mt-3" />
      <div className="mt-3">
        <Button variant="text" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
          {open ? 'Leckék elrejtése' : 'Leckék megjelenítése'}
        </Button>
      </div>
      {open && (
        <div id={panelId} className="mt-3">
          <LessonList slug={track.slug} statuses={track.lessons} />
        </div>
      )}
    </Panel>
  )
}

function LessonList({ slug, statuses }: { slug: string; statuses: TrackProgress['lessons'] }) {
  const structure = useQuery(trackQuery(slug))

  if (structure.isPending) return <Skeleton lines={3} label="Leckék betöltése…" />
  if (structure.isError) return <p className="text-15 text-wrong">{hibaUzenet(structure.error)}</p>

  const statusById = new Map(statuses.map((l) => [l.id, l.status]))

  return (
    <div className="flex flex-col gap-5">
      {structure.data.modules
        .filter((module) => module.lessons.length > 0)
        .map((module) => (
          <section key={module.id} aria-label={module.title}>
            <h4 className="text-15 font-bold">{module.title}</h4>
            <ul className="mt-1">
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
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-grid py-1">
      <Link to={`/leckek/${lesson.id}`} className="inline-flex min-h-11 items-center text-16 text-ink">
        {lesson.title}
      </Link>
      <LessonStatusBadge status={status} />
    </li>
  )
}
