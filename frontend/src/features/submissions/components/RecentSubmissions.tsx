import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Panel } from '../../../shared/ui/Panel'
import { LoadError, Skeleton } from '../../../shared/ui/States'
import { CardTitle } from '../../../shared/ui/Text'
import { recentSubmissionsQuery } from '../api'
import { SubmissionLine } from './SubmissionLine'

/** „Legutóbbi beadások” a haladás oldalon (#147): innen folytatható, ami félbemaradt. */
export function RecentSubmissions() {
  const recent = useQuery(recentSubmissionsQuery())

  return (
    <Panel as="section" className="mt-6" aria-labelledby="legutobbi-beadasok">
      <CardTitle id="legutobbi-beadasok">Legutóbbi beadások</CardTitle>

      {recent.isError ? (
        <div className="mt-4">
          <LoadError error={recent.error} onRetry={() => void recent.refetch()} title="Nem sikerült betölteni a beadásaidat" />
        </div>
      ) : recent.isPending ? (
        <Skeleton lines={3} label="Beadások betöltése…" className="mt-4" />
      ) : recent.data.length === 0 ? (
        <p className="mt-1 text-15 leading-relaxed text-ink-soft">
          Még nem adtál be megoldást. Egy feladat oldalán a Beadás gomb menti el a munkádat.
        </p>
      ) : (
        <ul className="mt-3">
          {recent.data.map(
            (submission) =>
              submission.exercise && (
                <li key={submission.id} data-testid="recent-submission" className="border-t border-grid">
                  <Link to={`/feladatok/${submission.exercise.id}`} className="flex min-h-11 items-center py-2 no-underline hover:bg-note">
                    <SubmissionLine submission={submission} title={submission.exercise.title} />
                  </Link>
                </li>
              ),
          )}
        </ul>
      )}
    </Panel>
  )
}
