import { Link, useLocation } from 'react-router-dom'
import { AuthCard } from '../../../shared/ui/Form'

export function RegisterDone() {
  const email = (useLocation().state as { email?: string } | null)?.email

  return (
    <AuthCard title="Már csak egy lépés">
      <p className="text-slate-300">
        Küldtünk egy megerősítő levelet{email ? <> ide: <strong className="text-slate-100">{email}</strong></> : null}. Kattints
        a benne lévő linkre, hogy aktiváld a fiókodat.
      </p>
      <p className="text-sm text-slate-400">Nem jött meg? Nézd meg a spam mappát, vagy kérj újat a fejlécben.</p>
      <Link to="/feladatok" className="inline-block text-sky-400 hover:underline">
        Tovább a feladatokhoz
      </Link>
    </AuthCard>
  )
}
