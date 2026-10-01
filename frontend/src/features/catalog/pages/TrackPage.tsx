import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { hibaUzenet, httpStatus } from '../../../shared/api/errors'
import { Alert } from '../../../shared/ui/Form'
import { PageLoader } from '../../../shared/ui/PageLoader'
import type { LessonSummary, TrackDetail } from '../../../types'
import { lessonPath } from '../../lesson/api'
import { trackQuery } from '../api'
import { LessonRow } from '../components/LessonRow'

/**
 * A lecke, ahol a tanulás folytatható: az első, amelyik elérhető és még nincs kész.
 * Feladat nélküli lecke nem teljesíthető, ezért azon nem akadunk meg.
 */
function nextLesson(track: TrackDetail): LessonSummary | undefined {
  return track.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => !lesson.locked && lesson.status !== 'completed' && lesson.exercises.length > 0)
}

/** Egy képzési ág (#142): modulonként a leckék, a néző haladásával és a zárolt leckék jelölésével. */
export function TrackPage() {
  const { trackSlug = '' } = useParams<{ trackSlug: string }>()
  const track = useQuery(trackQuery(trackSlug))

  if (track.isPending) return <PageLoader />

  if (track.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Alert kind="error">
          {httpStatus(track.error) === 404 ? 'Ez a képzési ág nem található.' : hibaUzenet(track.error)}
        </Alert>
        <BackLink />
      </div>
    )
  }

  const next = nextLesson(track.data)
  const started = track.data.modules.some((module) => module.lessons.some((lesson) => lesson.status && lesson.status !== 'not_started'))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <title>{`${track.data.title} – InfoTanár`}</title>
      <BackLink />
      <h1 className="mt-3 text-2xl font-semibold text-slate-100">{track.data.title}</h1>
      {track.data.description && <p className="mt-2 text-slate-300">{track.data.description}</p>}

      {next && (
        <Link
          to={lessonPath(track.data.slug, next.slug)}
          className="mt-6 inline-block rounded-lg bg-sky-700 px-5 py-2.5 font-medium text-white transition hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          {started ? 'Folytatás' : 'Kezdés'}: {next.title}
        </Link>
      )}

      <div className="mt-8 space-y-8">
        {track.data.modules
          .filter((module) => module.lessons.length > 0)
          .map((module) => (
            <section key={module.id} aria-labelledby={`modul-${module.id}`}>
              <h2 id={`modul-${module.id}`} className="text-lg font-semibold text-slate-100">
                {module.title}
              </h2>
              {module.description && <p className="mt-1 text-sm text-slate-400">{module.description}</p>}
              <ol className="mt-3 divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
                {module.lessons.map((lesson) => (
                  <LessonRow key={lesson.id} trackSlug={track.data.slug} lesson={lesson} />
                ))}
              </ol>
            </section>
          ))}
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/tananyag" className="mt-4 inline-block text-sm text-sky-400 underline-offset-2 hover:underline">
      ← Tananyag
    </Link>
  )
}
