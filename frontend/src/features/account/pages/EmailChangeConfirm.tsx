import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { Alert, AuthCard } from '../../../shared/ui/Form'
import { useAuth } from '../../auth/context'
import * as accountApi from '../api'

/** Az új e-mail-címre küldött link céloldala (#135): beváltja a linket, és jelzi az eredményt. */
export function EmailChangeConfirm() {
  const [params] = useSearchParams()
  const { user, refresh } = useAuth()

  // Query (nem mutation), mint az e-mail-megerősítésnél: így a StrictMode
  // kettős effektje sem váltja be kétszer ugyanazt a linket.
  // A kulcs az `auth` ág alá tartozik: a refresh() minden más lekérdezést
  // újraindít, és a második beváltás már érvénytelen linkként hibázna.
  const confirmation = useQuery({
    queryKey: ['auth', 'confirm-email-change', params.toString()],
    queryFn: async () => {
      const message = await accountApi.confirmEmailChange(params)
      await refresh()
      return message
    },
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  })

  return (
    <AuthCard title="E-mail-cím módosítása">
      <title>E-mail-cím módosítása – InfoTanár</title>
      {confirmation.isPending && <p className="text-slate-400">Megerősítés folyamatban…</p>}
      {confirmation.isSuccess && (
        <>
          <Alert kind="success">{confirmation.data}</Alert>
          <p className="text-sm text-slate-300">Mostantól az új címeddel tudsz belépni.</p>
          <Link
            to={user ? '/fiok' : '/bejelentkezes'}
            className="inline-block text-sky-400 underline underline-offset-2 hover:text-sky-300"
          >
            {user ? 'Vissza a fiókomhoz' : 'Bejelentkezés'}
          </Link>
        </>
      )}
      {confirmation.isError && (
        <>
          <Alert kind="error">{hibaUzenet(confirmation.error)}</Alert>
          <p className="text-sm text-slate-400">A link lejárt vagy már felhasználták. A fiókodban új cserét kérhetsz.</p>
        </>
      )}
    </AuthCard>
  )
}
