import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useParams } from 'react-router-dom'
import { httpStatus } from '../../../shared/api/errors'
import { LANGUAGE_LABEL } from '../../../shared/domain/labels'
import { Badge, LevelBadge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Breadcrumb } from '../../../shared/ui/Breadcrumb'
import { ButtonLink } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { StateIcon } from '../../../shared/ui/Icon'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { Panel } from '../../../shared/ui/Panel'
import { Prose } from '../../../shared/ui/Prose'
import { LoadError } from '../../../shared/ui/States'
import { CardTitle, PageTitle } from '../../../shared/ui/Text'
import type { ExerciseSummary, LessonDetail } from '../../../types'
import { trackQuery } from '../../catalog/api'
import { useCatalogTree } from '../../catalog/useCatalogTree'
import { lessonPath, lessonQuery } from '../../lesson/api'
import { CompleteLesson } from '../../lesson/components/CompleteLesson'
import { ExerciseStatusBadge } from '../../progress/components/ExerciseStatusBadge'
import { NotFound } from '../../system/NotFound'
import { LessonVideo } from '../../workspace/components/LessonVideo'
import { Paywall } from '../../workspace/components/Paywall'

/**
 * A lecke azonosítójával érkező régi hivatkozás (`/leckek/:id`): a katalógusból
 * kikeressük a sávot és a lecke nevét, majd a végleges címre irányítunk.
 */
export function LessonById() {
  const id = Number(useParams<{ id: string }>().id)
  const { tree, isPending, error, refetch } = useCatalogTree()

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

  return <Navigate to={lessonPath(place.track.slug, place.lesson.slug)} replace />
}

/** Leckeoldal (#143): videó, tananyag, gyakorlófeladatok, a modul vázlata és lépkedés a szomszédos leckékre. */
export function LessonPage() {
  const { sav = '', lecke = '' } = useParams<{ sav: string; lecke: string }>()
  const lesson = useQuery(lessonQuery(sav, lecke))

  if (lesson.isPending) return <PageLoader label="Lecke betöltése…" />

  if (lesson.isError) {
    if (httpStatus(lesson.error) === 404) return <NotFound />

    return (
      <main className="mx-auto w-full max-w-page flex-1 px-4 py-12 md:px-6">
        <LoadError error={lesson.error} onRetry={() => void lesson.refetch()} title="Nem sikerült betölteni a leckét" />
      </main>
    )
  }

  return <Lesson lesson={lesson.data} />
}

function Lesson({ lesson }: { lesson: LessonDetail }) {
  const firstExercise = lesson.exercises[0]
  const trackPath = `/tanulasi-ut/${encodeURIComponent(lesson.track.slug)}`

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <title>{`${lesson.title} – InfoTanár`}</title>
      <Breadcrumb items={[{ label: 'Tanulási út', to: '/tanulasi-ut' }, { label: lesson.track.title, to: trackPath }, { label: lesson.title }]} />
      <PageTitle size="compact" className="mt-4">
        {lesson.title}
      </PageTitle>
      <div className="mt-3 flex flex-wrap gap-2">
        {lesson.is_free ? <Badge kind="free">Ingyenes</Badge> : <Badge kind="prem">Prémium</Badge>}
        {lesson.status === 'completed' && <Badge kind="ok">Teljesítve</Badge>}
        {lesson.status === 'in_progress' && <Badge kind="neutral">Folyamatban</Badge>}
      </div>

      <div className="mt-8 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-1 basis-140 flex-col gap-6">
          {lesson.locked ? (
            <Paywall reason={lesson.locked_reason} message={lesson.locked_message} />
          ) : (
            <>
              {lesson.has_video ? (
                <LessonVideo lesson={lesson} />
              ) : (
                lesson.content.trim() === '' && (
                  <Banner kind="info" title="Ehhez a leckéhez még nem készült videó és jegyzet">
                    {lesson.exercises.length > 0 ? 'A lecke gyakorlófeladatait lent találod.' : 'Nézz vissza később, vagy folytasd a következő leckével.'}
                  </Banner>
                )
              )}

              {lesson.content.trim() !== '' && (
                <Panel as="section" pad="xl" aria-label="Tananyag" data-testid="lesson-content">
                  <Prose markdown={lesson.content} codeBlocks />
                </Panel>
              )}

              <Exercises exercises={lesson.exercises} />
              <CompleteLesson lesson={lesson} />
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {firstExercise && !lesson.locked && <ButtonLink to={`/feladatok/${firstExercise.id}`}>Feladat megnyitása</ButtonLink>}
            {lesson.previous && (
              <ButtonLink to={lessonPath(lesson.track.slug, lesson.previous.slug)} variant="secondary" icon="chevron-left">
                Előző lecke: {lesson.previous.title}
              </ButtonLink>
            )}
            {lesson.next && (
              <ButtonLink to={lessonPath(lesson.track.slug, lesson.next.slug)} variant="secondary">
                Következő lecke: {lesson.next.title}
              </ButtonLink>
            )}
          </div>
        </div>

        <ModuleOutline lesson={lesson} />
      </div>
    </main>
  )
}

function Exercises({ exercises }: { exercises: ExerciseSummary[] }) {
  return (
    <Panel as="section" aria-labelledby="gyakorlas">
      <CardTitle id="gyakorlas" as="h2">
        Gyakorlás
      </CardTitle>
      {exercises.length === 0 ? (
        <p className="mt-2 text-16 leading-relaxed text-ink-soft">Ehhez a leckéhez nincs gyakorlófeladat.</p>
      ) : (
        <>
          <ul className="mt-3">
            {exercises.map((exercise) => (
              <li key={exercise.id} data-testid="lesson-exercise" className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grid py-1">
                <Link to={`/feladatok/${exercise.id}`} className="inline-flex min-h-11 min-w-0 flex-1 basis-56 items-center text-16 font-medium text-ink">
                  {exercise.title}
                </Link>
                {exercise.my_status && <ExerciseStatusBadge status={exercise.my_status} />}
                <LevelBadge level={exercise.level} />
                {exercise.allowed_languages.map((language) => (
                  <Badge key={language} kind="lang">
                    {LANGUAGE_LABEL[language]}
                  </Badge>
                ))}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-15 leading-relaxed text-ink-soft">
            A lecke akkor számít késznek, ha minden feladatát beadtad, és a rejtett teszteken is átment.
          </p>
        </>
      )}
    </Panel>
  )
}

/** A lecke moduljának többi leckéje; a sáv szerkezetéből jön, ezért a lecke után, külön töltődik. */
function ModuleOutline({ lesson }: { lesson: LessonDetail }) {
  const track = useQuery(trackQuery(lesson.track.slug))
  const module = track.data?.modules.find((item) => item.id === lesson.module.id)

  if (!module) return null

  const done = module.lessons.filter((item) => item.status === 'completed').length
  // Vendégnél nincs haladás: ott a számláló sem jelenik meg.
  const tracked = module.lessons.some((item) => item.status !== null)

  return (
    <aside className="w-full md:w-80 md:flex-none">
      <Panel as="nav" aria-label="A modul leckéi">
        <CardTitle as="h2">{module.title}</CardTitle>
        {tracked && (
          <p className="mt-1 text-15 text-ink-soft">
            {done} / {module.lessons.length} kész
          </p>
        )}
        <ul className="mt-3">
          {module.lessons.map((item) => {
            const current = item.id === lesson.id
            return (
              <li key={item.id} className="border-t border-grid">
                <Link
                  to={lessonPath(lesson.track.slug, item.slug)}
                  aria-current={current ? 'page' : undefined}
                  className={cx('flex min-h-11 items-center gap-3 py-1.5 text-15 text-ink no-underline hover:underline', current && 'font-bold')}
                >
                  <StateIcon kind={item.status === 'completed' ? 'ok' : 'empty'} />
                  {item.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </Panel>
    </aside>
  )
}
