import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { Alert } from '../../../shared/ui/Form'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { progressQuery } from '../api'
import { LESSON_STATUS_LABEL } from '../../../shared/domain/labels'
import { LessonStatusBadge } from '../components/LessonStatusBadge'
import { ProgressBar } from '../components/ProgressBar'
import { TrackProgressCard } from '../components/TrackProgressCard'
import { RecentSubmissions } from '../../submissions/components/RecentSubmissions'

/** Haladásom (#28): összesített és képzési áganként bontott haladás, leckeállapotokkal. */
export function ProgressDashboard() {
  const progress = useQuery(progressQuery())

  if (progress.isPending) return <PageLoader />

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-100">Haladásom</h1>

      {progress.isError ? (
        <div className="mt-6">
          <Alert kind="error">{hibaUzenet(progress.error)}</Alert>
        </div>
      ) : progress.data.tracks.length === 0 ? (
        <p className="mt-6 text-slate-400">Még nincs elérhető tananyag.</p>
      ) : (
        <>
          <section aria-label="Összesítés" className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
            <ProgressBar
              label="Összes lecke"
              completed={progress.data.overall.completed}
              total={progress.data.overall.total}
              percent={progress.data.overall.percent}
              size="lg"
            />
            {progress.data.overall.completed === 0 && (
              <p className="mt-3 text-sm text-slate-400">
                Még nem teljesítettél leckét.{' '}
                <Link to="/tananyag" className="text-sky-400 underline underline-offset-2 hover:text-sky-300">
                  Kezdd az első leckével!
                </Link>
              </p>
            )}
          </section>

          <Legend />

          <ul className="mt-6 space-y-4">
            {progress.data.tracks.map((track, index) => (
              <TrackProgressCard key={track.id} track={track} defaultOpen={index === 0} />
            ))}
          </ul>

          <RecentSubmissions />
        </>
      )}
    </div>
  )
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400" aria-hidden="true">
      <span>Jelmagyarázat:</span>
      {(Object.keys(LESSON_STATUS_LABEL) as Array<keyof typeof LESSON_STATUS_LABEL>).map((status) => (
        <LessonStatusBadge key={status} status={status} />
      ))}
    </div>
  )
}
