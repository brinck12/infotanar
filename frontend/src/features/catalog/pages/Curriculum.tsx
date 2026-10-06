import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { Alert } from '../../../shared/ui/Form'
import { PageLoader } from '../../../shared/ui/PageLoader'
import type { TrackSummary } from '../../../types'
import { ProgressBar } from '../../progress/components/ProgressBar'
import { tracksQuery } from '../api'

/** Tananyag (#142): a képzési ágak, innen indul a tanulás. */
export function Curriculum() {
  const tracks = useQuery(tracksQuery())

  if (tracks.isPending) return <PageLoader />

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <title>Tananyag – InfoTanár</title>
      <h1 className="text-2xl font-semibold text-slate-100">Tananyag</h1>
      <p className="mt-2 text-slate-300">
        Válassz képzési ágat. A leckék egymásra épülnek; mindegyik ág első leckéi ingyenesek.
      </p>

      <div className="mt-8">
        {tracks.isError ? (
          <Alert kind="error">{hibaUzenet(tracks.error)}</Alert>
        ) : tracks.data.length === 0 ? (
          <p className="text-slate-400">Még nincs elérhető tananyag.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {tracks.data.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function TrackCard({ track }: { track: TrackSummary }) {
  return (
    <li>
      <Link
        to={`/tananyag/${track.slug}`}
        data-testid="track-card"
        className="flex h-full flex-col rounded-lg border border-slate-800 bg-slate-900 p-5 transition hover:border-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <h2 className="text-lg font-semibold text-slate-100">{track.title}</h2>
        {track.description && <p className="mt-2 text-sm text-slate-300">{track.description}</p>}

        <p className="mt-4 text-sm text-slate-400">
          {track.lesson_count} lecke
          {track.free_lesson_count > 0 && <> · ebből {track.free_lesson_count} ingyenes</>}
        </p>

        {/* Csak bejelentkezve van haladás; a kártya alja egy vonalban marad a szomszédjával. */}
        {track.progress && (
          <div className="mt-auto pt-4">
            <ProgressBar
              label="Haladásod"
              completed={track.progress.completed}
              total={track.progress.total}
              percent={track.progress.percent}
            />
          </div>
        )}
      </Link>
    </li>
  )
}
