import { useQuery } from '@tanstack/react-query'
import { daysUntilExam, tasksUntilExam } from '../../../shared/domain/exam'
import { readLastTask, userKeyOf } from '../../../shared/domain/lastTask'
import { ButtonLink } from '../../../shared/ui/Button'
import { Icon } from '../../../shared/ui/Icon'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { Panel } from '../../../shared/ui/Panel'
import { Bar } from '../../../shared/ui/Progress'
import { Stat } from '../../../shared/ui/Stat'
import { EmptyState, LoadError } from '../../../shared/ui/States'
import { CardTitle, PageTitle } from '../../../shared/ui/Text'
import type { ProgressReport } from '../../../types'
import { useAuth } from '../../auth/context'
import { RecentSubmissions } from '../../submissions/components/RecentSubmissions'
import { progressQuery } from '../api'
import { TrackProgressCard } from '../components/TrackProgressCard'

/** Haladásom (#28): visszaszámlálás, összesítés és képzési áganként a leckék állapota. */
export function ProgressDashboard() {
  const { user } = useAuth()
  const progress = useQuery(progressQuery())
  const lastTask = readLastTask(userKeyOf(user))
  const days = daysUntilExam()

  if (progress.isPending) return <PageLoader />

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <PageTitle>Haladásom</PageTitle>

      <Panel kind="highlight" className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Icon name="calendar" size={28} className="text-accent" />
        <div className="min-w-0 flex-1 basis-80">
          <p className="font-serif text-22 leading-snug font-semibold">Még {days} nap van az írásbeli érettségiig.</p>
          <p className="mt-1 text-16 leading-relaxed text-ink-soft">Heti két feladattal addig {tasksUntilExam(days)} feladat jön össze.</p>
        </div>
        {lastTask ? (
          <ButtonLink to={`/feladatok/${lastTask.id}`} size="lg">
            Folytatás: {lastTask.title}
          </ButtonLink>
        ) : (
          <ButtonLink to="/tanulasi-ut" size="lg">
            Tanulási út megnyitása
          </ButtonLink>
        )}
      </Panel>

      {progress.isError ? (
        <div className="mt-8">
          <LoadError error={progress.error} onRetry={() => void progress.refetch()} />
        </div>
      ) : progress.data.tracks.length === 0 ? (
        <EmptyState title="Még nincs elérhető tananyag" className="mt-8">
          Amint megjelenik az első lecke, itt követheted, hol tartasz.
        </EmptyState>
      ) : (
        <Report report={progress.data} />
      )}
    </main>
  )
}

function Report({ report }: { report: ProgressReport }) {
  const inProgress = report.tracks.reduce((sum, track) => sum + track.lessons.filter((lesson) => lesson.status === 'in_progress').length, 0)
  const remaining = report.overall.total - report.overall.completed

  return (
    <>
      <section aria-label="Összesítés" className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Teljesített lecke" value={report.overall.completed} note={`a ${report.overall.total} leckéből, ${report.overall.percent}%`} />
        <Stat label="Folyamatban lévő lecke" value={inProgress} note="elkezdted, de még nincs kész" />
        <Stat label="Hátralévő lecke" value={remaining} note={remaining === 0 ? 'minden lecke kész' : 'ennyi van még előtted'} />
      </section>

      <Panel as="section" className="mt-6" aria-labelledby="savok-osszesites">
        <CardTitle id="savok-osszesites">Hol tartasz a tanulási utakon?</CardTitle>
        <p className="mt-1 text-15 leading-relaxed text-ink-soft">A teljesített leckék aránya sávonként.</p>
        <ul className="mt-4 flex flex-col gap-4">
          {report.tracks.map((track) => (
            <li key={track.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-16">
                <span className="font-semibold">{track.title}</span>
                <span className="text-15 text-ink-soft">
                  {track.completed} / {track.total} lecke
                </span>
              </div>
              <Bar value={track.completed} max={track.total} label={`${track.percent} százalék`} className="mt-2" />
            </li>
          ))}
        </ul>
      </Panel>

      <h2 className="mt-12 font-serif text-28 leading-snug font-semibold tracking-tight">Leckék sávonként</h2>
      <ul className="mt-5 flex flex-col gap-4">
        {report.tracks.map((track, index) => (
          <TrackProgressCard key={track.id} track={track} defaultOpen={index === 0} />
        ))}
      </ul>

      <RecentSubmissions />
    </>
  )
}
