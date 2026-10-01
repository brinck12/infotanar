import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { hibaUzenet, httpStatus } from '../../../shared/api/errors'
import { LEVEL_LABEL } from '../../../shared/domain/labels'
import { AccessBadge } from '../../../shared/ui/AccessBadge'
import { Alert } from '../../../shared/ui/Form'
import { PageLoader } from '../../../shared/ui/PageLoader'
import type { LessonDetail, LessonExercise, LessonLink } from '../../../types'
import { LessonVideo } from '../../workspace/components/LessonVideo'
import { Paywall } from '../../workspace/components/Paywall'
import { lessonPath, lessonQuery } from '../api'
import { LessonContent } from '../components/LessonContent'

/** Egy lecke oldala (#143): videó, tananyag, feladatok, lépkedés a szomszédos leckékre. */
export function LessonPage() {
  const { trackSlug = '', lessonSlug = '' } = useParams<{ trackSlug: string; lessonSlug: string }>()
  const lesson = useQuery(lessonQuery(trackSlug, lessonSlug))

  if (lesson.isPending) return <PageLoader label="Lecke betöltése…" />

  if (lesson.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Alert kind="error">
          {httpStatus(lesson.error) === 404 ? 'Ez a lecke nem található.' : hibaUzenet(lesson.error)}
        </Alert>
        <Link to="/tananyag" className="mt-4 inline-block text-sm text-sky-400 underline-offset-2 hover:underline">
          ← Tananyag
        </Link>
      </div>
    )
  }

  return (
    // A szélesség kb. 70 karakteres sorokat ad: a hosszabb szöveg így olvasható kényelmesen.
    <article className="mx-auto max-w-3xl px-4 py-10">
      <title>{`${lesson.data.title} – InfoTanár`}</title>
      <Breadcrumb lesson={lesson.data} />

      <h1 className="mt-3 text-2xl font-semibold text-balance text-slate-100">{lesson.data.title}</h1>
      <p className="mt-2">
        <AccessBadge free={lesson.data.is_free} locked={lesson.data.locked} />
      </p>

      <div className="mt-8 space-y-10">
        {lesson.data.locked ? (
          <Paywall reason={lesson.data.locked_reason} message={lesson.data.locked_message} />
        ) : (
          <>
            {lesson.data.has_video && <LessonVideo lesson={lesson.data} />}
            {lesson.data.content.trim() !== '' && <LessonContent>{lesson.data.content}</LessonContent>}
            <Exercises exercises={lesson.data.exercises} />
          </>
        )}

        <NeighbourLinks trackSlug={lesson.data.track.slug} previous={lesson.data.previous} next={lesson.data.next} />
      </div>
    </article>
  )
}

function Breadcrumb({ lesson }: { lesson: LessonDetail }) {
  const link = 'text-sky-400 underline-offset-2 hover:underline'

  return (
    <nav aria-label="Hol tartasz a tananyagban" className="text-sm text-slate-400">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link to="/tananyag" className={link}>
            Tananyag
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li>
          <Link to={`/tananyag/${lesson.track.slug}`} className={link}>
            {lesson.track.title}
          </Link>
        </li>
        {lesson.module.title && (
          <>
            <li aria-hidden="true">›</li>
            <li>{lesson.module.title}</li>
          </>
        )}
      </ol>
    </nav>
  )
}

function Exercises({ exercises }: { exercises: LessonExercise[] }) {
  if (exercises.length === 0) return null

  return (
    <section aria-labelledby="lecke-feladatok">
      <h2 id="lecke-feladatok" className="text-lg font-semibold text-slate-100">
        Feladatok
      </h2>
      <ul className="mt-3 divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
        {exercises.map((exercise) => (
          <li key={exercise.id} data-testid="lesson-exercise">
            <Link
              to={`/feladatok/${exercise.id}`}
              className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset"
            >
              <span>
                <span className="font-medium text-slate-100 group-hover:text-sky-300">{exercise.title}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{LEVEL_LABEL[exercise.level]}</span>
              </span>
              {exercise.solved && <SolvedBadge />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Szöveg + ikon, nem csak szín. */
function SolvedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800 bg-emerald-950 px-2.5 py-0.5 text-xs text-emerald-300">
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="m3.5 8.5 3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Megoldva
    </span>
  )
}

function NeighbourLinks({ trackSlug, previous, next }: { trackSlug: string; previous: LessonLink | null; next: LessonLink | null }) {
  if (!previous && !next) return null

  const card =
    'block rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 transition hover:border-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400'

  return (
    <nav aria-label="Szomszédos leckék" className="grid gap-3 sm:grid-cols-2">
      {previous && (
        <Link to={lessonPath(trackSlug, previous.slug)} className={card}>
          <span className="block text-xs text-slate-400">← Előző lecke</span>
          <span className="mt-0.5 block font-medium text-slate-100">{previous.title}</span>
        </Link>
      )}
      {next && (
        <Link to={lessonPath(trackSlug, next.slug)} className={`${card} sm:col-start-2 sm:text-right`}>
          <span className="block text-xs text-slate-400">Következő lecke →</span>
          <span className="mt-0.5 block font-medium text-slate-100">{next.title}</span>
        </Link>
      )}
    </nav>
  )
}
