import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { httpStatus } from '../../../shared/api/errors'
import { trackIcon } from '../../../shared/domain/exam'
import { Badge } from '../../../shared/ui/Badge'
import { Breadcrumb } from '../../../shared/ui/Breadcrumb'
import { ButtonLink } from '../../../shared/ui/Button'
import { Icon, StateIcon } from '../../../shared/ui/Icon'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { Panel } from '../../../shared/ui/Panel'
import { Tiles } from '../../../shared/ui/Progress'
import { EmptyState, LoadError } from '../../../shared/ui/States'
import { CardTitle, Lead, PageTitle } from '../../../shared/ui/Text'
import type { LessonProgressStatus, LessonSummary, ModuleSummary } from '../../../types'
import { useAuth } from '../../auth/context'
import { trackQuery } from '../../catalog/api'
import { useLessonStatuses } from '../../progress/useLessonStatuses'
import { NotFound } from '../../system/NotFound'

/** Egy sáv áttekintése: modulonként a leckék és a hozzájuk tartozó gyakorlófeladatok. */
export function TrackPage() {
  const { sav = '' } = useParams<{ sav: string }>()
  const { user } = useAuth()
  const track = useQuery(trackQuery(sav))
  const statuses = useLessonStatuses()

  if (track.isPending) return <PageLoader label="Sáv betöltése…" />
  if (track.isError) {
    if (httpStatus(track.error) === 404) return <NotFound />
    return (
      <main className="mx-auto w-full max-w-page flex-1 px-4 py-12 md:px-6">
        <LoadError error={track.error} onRetry={() => void track.refetch()} />
      </main>
    )
  }

  const modules = track.data.modules.filter((module) => module.lessons.length > 0)
  const lessons = modules.flatMap((module) => module.lessons)
  const freeCount = lessons.filter((lesson) => lesson.is_free).length
  const exerciseCount = lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0)
  const doneCount = statuses ? lessons.filter((lesson) => statuses.get(lesson.id) === 'completed').length : 0
  const nextLesson = lessons.find((lesson) => statuses?.get(lesson.id) !== 'completed') ?? lessons[0]

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <Breadcrumb items={[{ label: 'Tanulási út', to: '/tanulasi-ut' }, { label: track.data.title }]} />
      <PageTitle className="mt-4">{track.data.title}</PageTitle>
      {track.data.description && <Lead className="mt-3 max-w-prose text-18">{track.data.description}</Lead>}

      <div className="mt-8 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-1 basis-140 flex-col gap-6">
          {modules.length === 0 && <EmptyState title="Ebben a sávban még nincs lecke">Hamarosan érkezik.</EmptyState>}
          {modules.map((module) => (
            <ModuleSection key={module.id} module={module} statuses={statuses} />
          ))}
        </div>

        <aside className="flex w-full flex-col gap-6 md:w-80 md:flex-none">
          <Panel kind="highlight">
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-note">
              <Icon name={trackIcon(track.data.slug)} size={22} />
            </span>
            <p className="mt-3 font-serif text-22 leading-snug font-semibold">
              {lessons.length} lecke, {exerciseCount} feladat
            </p>
            <p className="mt-1 text-15 leading-relaxed text-ink-soft">Ebből {freeCount} lecke ingyenes, belépés nélkül is megnyílik.</p>
            {statuses && (
              <p className="mt-3 text-16 font-semibold">
                {doneCount} / {lessons.length} lecke kész
              </p>
            )}
            {nextLesson && (
              <ButtonLink to={`/leckek/${nextLesson.id}`} fullWidth className="mt-4">
                {doneCount > 0 ? 'Folytatás' : 'Első lecke megnyitása'}
              </ButtonLink>
            )}
            {!user && (
              <p className="mt-3 text-14 leading-relaxed text-ink-soft">
                A haladásod elmentéséhez <Link to="/regisztracio">regisztrálj</Link>, ingyenes.
              </p>
            )}
          </Panel>

          <Panel kind="note">
            <CardTitle as="h2">Így gyakorolsz</CardTitle>
            <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-15 leading-normal">
              <li>Megnézed a lecke rövid videóját.</li>
              <li>Megoldod a hozzá tartozó feladatot a beépített szerkesztőben.</li>
              <li>Futtatod, és tesztesetenként látod, mi sikerült.</li>
              <li>Beadod: ekkor a rejtett tesztek is lefutnak, és a lecke késznek számít.</li>
            </ol>
          </Panel>
        </aside>
      </div>
    </main>
  )
}

function ModuleSection({ module, statuses }: { module: ModuleSummary; statuses: Map<number, LessonProgressStatus> | null }) {
  const done = statuses ? module.lessons.filter((lesson) => statuses.get(lesson.id) === 'completed').length : 0

  return (
    <Panel as="section" aria-labelledby={`modul-${module.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <CardTitle id={`modul-${module.id}`} as="h2">
          {module.title}
        </CardTitle>
        {statuses && (
          <span className="text-15 text-ink-soft">
            {done} / {module.lessons.length} kész
          </span>
        )}
      </div>
      {module.description && <p className="mt-1.5 max-w-prose text-16 leading-normal text-ink-soft">{module.description}</p>}
      {statuses && <Tiles done={done} total={module.lessons.length} className="mt-3 max-w-xs" />}
      <ul className="mt-3">
        {module.lessons.map((lesson) => (
          <LessonRows key={lesson.id} lesson={lesson} status={statuses?.get(lesson.id)} />
        ))}
      </ul>
    </Panel>
  )
}

function LessonRows({ lesson, status }: { lesson: LessonSummary; status: LessonProgressStatus | undefined }) {
  return (
    <>
      <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grid py-0.5">
        <StateIcon kind={status === 'completed' ? 'ok' : 'empty'} />
        <Icon name="play" size={18} className="text-ink-soft" />
        <Link to={`/leckek/${lesson.id}`} className="inline-flex min-h-11 min-w-0 flex-1 basis-56 items-center text-16 font-medium text-ink">
          {lesson.title}
        </Link>
        <span className="text-13 text-ink-soft">Lecke</span>
        {lesson.is_free ? <Badge kind="free">Ingyenes</Badge> : <Badge kind="prem">Prémium</Badge>}
      </li>
      {lesson.exercises.map((exercise) => (
        <li key={exercise.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grid py-0.5 pl-8">
          <Icon name="code" size={18} className="text-ink-soft" />
          <Link to={`/feladatok/${exercise.id}`} className="inline-flex min-h-11 min-w-0 flex-1 basis-56 items-center text-16 text-ink">
            {exercise.title}
          </Link>
          <span className="text-13 text-ink-soft">Gyakorló feladat</span>
        </li>
      ))}
    </>
  )
}
