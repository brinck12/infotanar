import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { recentSubmissionsQuery } from '../api'
import { SubmissionLine } from './SubmissionLine'

/** „Legutóbbi beadások” a haladás oldalon (#147): innen folytatható, ami félbemaradt. */
export function RecentSubmissions() {
  const recent = useQuery(recentSubmissionsQuery())

  return (
    <section aria-labelledby="legutobbi-beadasok" className="mt-10">
      <h2 id="legutobbi-beadasok" className="text-lg font-semibold text-slate-100">
        Legutóbbi beadások
      </h2>

      <div className="mt-3">
        {recent.isError ? (
          <p className="text-sm text-red-300">{hibaUzenet(recent.error)}</p>
        ) : recent.isPending ? (
          <p className="text-sm text-slate-400">Beadások betöltése…</p>
        ) : recent.data.length === 0 ? (
          <p className="text-sm text-slate-400">Még nem adtál be megoldást.</p>
        ) : (
          <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
            {recent.data.map(
              (submission) =>
                submission.exercise && (
                  <li key={submission.id} data-testid="recent-submission">
                    <Link
                      to={`/feladatok/${submission.exercise.id}`}
                      className="block px-4 py-3 transition hover:bg-slate-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset"
                    >
                      <SubmissionLine submission={submission} title={submission.exercise.title} />
                    </Link>
                  </li>
                ),
            )}
          </ul>
        )}
      </div>
    </section>
  )
}
