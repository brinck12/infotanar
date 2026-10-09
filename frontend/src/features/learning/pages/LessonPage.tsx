import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { LANGUAGE_LABEL } from '../../../shared/domain/labels'
import { Badge, LevelBadge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Breadcrumb } from '../../../shared/ui/Breadcrumb'
import { ButtonLink } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { StateIcon } from '../../../shared/ui/Icon'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { Panel } from '../../../shared/ui/Panel'
import { LoadError, Skeleton } from '../../../shared/ui/States'
import { CardTitle, PageTitle } from '../../../shared/ui/Text'
import type { LessonProgressStatus } from '../../../types'
import { taskQuery } from '../../catalog/api'
import { useCatalogTree, type LessonPlace } from '../../catalog/useCatalogTree'
import { useLessonStatuses } from '../../progress/useLessonStatuses'
import { NotFound } from '../../system/NotFound'
import { LessonVideo } from '../../workspace/components/LessonVideo'
import { Paywall } from '../../workspace/components/Paywall'

/** Leckeoldal: videó, a modul vázlata és a leckéhez tartozó gyakorlófeladatok. */
export function LessonPage() {
  const id = Number(useParams<{ id: string }>().id)
  const { tree, isPending, error, refetch } = useCatalogTree()
  const statuses = useLessonStatuses()

  if (error) {
    return (
      <main className="mx-auto w-full max-w-page flex-1 px-4 py-12 md:px-6">
        <LoadError error={error} onRetry={refetch} title="Nem sikerült betölteni a leckét" />
      </main>
    )
  }
  if (isPending || !tree) return <PageLoader label="Lecke betöltése…" />

  const place = tree.lessons.get(id)
  if (!place) return <NotFound />

  return <Lesson place={place} statuses={statuses} />
}

function Lesson({ place, statuses }: { place: LessonPlace; statuses: Map<number, LessonProgressStatus> | null }) {
  const { track, module, lesson, next } = place
  const firstExercise = lesson.exercises[0]
  // Nincs külön lecke-végpont: a hozzáférést és a videó meglétét a lecke első feladata mutatja meg.
  const access = useQuery({ ...taskQuery(firstExercise?.id ?? 0), enabled: firstExercise !== undefined })
  const status = statuses?.get(lesson.id)
  const moduleDone = statuses ? module.lessons.filter((item) => statuses.get(item.id) === 'completed').length : 0

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <Breadcrumb items={[{ label: 'Tanulási út', to: '/tanulasi-ut' }, { label: track.title, to: `/tanulasi-ut/${track.slug}` }, { label: lesson.title }]} />
      <PageTitle size="compact" className="mt-4">
        {lesson.title}
      </PageTitle>
      <div className="mt-3 flex flex-wrap gap-2">
        {lesson.is_free ? <Badge kind="free">Ingyenes</Badge> : <Badge kind="prem">Prémium</Badge>}
        {status === 'completed' && <Badge kind="ok">Teljesítve</Badge>}
        {status === 'in_progress' && <Badge kind="neutral">Folyamatban</Badge>}
      </div>

      <div className="mt-8 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-1 basis-140 flex-col gap-6">
          {access.isLoading ? (
            <Skeleton lines={4} />
          ) : access.data?.locked ? (
            <Paywall reason={access.data.locked_reason} message={access.data.locked_message} />
          ) : (
            <>
              {access.data?.lesson ? (
                <LessonVideo lesson={access.data.lesson} />
              ) : (
                <Banner kind="info" title="Ehhez a leckéhez még nem készült videó">
                  A lecke gyakorlófeladatait lent találod.
                </Banner>
              )}

              <Panel as="section" aria-labelledby="gyakorlas">
                <CardTitle id="gyakorlas" as="h2">
                  Gyakorlás
                </CardTitle>
                {lesson.exercises.length === 0 ? (
                  <p className="mt-2 text-16 leading-relaxed text-ink-soft">Ehhez a leckéhez még nincs gyakorlófeladat.</p>
                ) : (
                  <ul className="mt-3">
                    {lesson.exercises.map((exercise) => (
                      <li key={exercise.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grid py-1">
                        <Link to={`/feladatok/${exercise.id}`} className="inline-flex min-h-11 min-w-0 flex-1 basis-56 items-center text-16 font-medium text-ink">
                          {exercise.title}
                        </Link>
                        <LevelBadge level={exercise.level} />
                        {exercise.allowed_languages.map((language) => (
                          <Badge key={language} kind="lang">
                            {LANGUAGE_LABEL[language]}
                          </Badge>
                        ))}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-15 leading-relaxed text-ink-soft">
                  A lecke akkor számít késznek, ha minden feladatát beadtad, és a rejtett teszteken is átment.
                </p>
              </Panel>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {firstExercise && !access.data?.locked && <ButtonLink to={`/feladatok/${firstExercise.id}`}>Feladat megnyitása</ButtonLink>}
            {next && (
              <ButtonLink to={`/leckek/${next.id}`} variant="secondary">
                Következő lecke: {next.title}
              </ButtonLink>
            )}
          </div>
        </div>

        <aside className="w-full md:w-80 md:flex-none">
          <Panel as="nav" aria-label="A modul leckéi">
            <CardTitle as="h2">{module.title}</CardTitle>
            {statuses && (
              <p className="mt-1 text-15 text-ink-soft">
                {moduleDone} / {module.lessons.length} kész
              </p>
            )}
            <ul className="mt-3">
              {module.lessons.map((item) => {
                const current = item.id === lesson.id
                return (
                  <li key={item.id} className="border-t border-grid">
                    <Link
                      to={`/leckek/${item.id}`}
                      aria-current={current ? 'page' : undefined}
                      className={cx(
                        'flex min-h-11 items-center gap-3 py-1.5 text-15 text-ink no-underline hover:underline',
                        current && 'font-bold',
                      )}
                    >
                      <StateIcon kind={statuses?.get(item.id) === 'completed' ? 'ok' : 'empty'} />
                      {item.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </aside>
      </div>
    </main>
  )
}
