import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { Alert, AuthCard } from '../../../shared/ui/Form'
import * as authApi from '../api'
import { useAuth } from '../context'

export function VerifyEmail() {
  const [params] = useSearchParams()
  const { refresh } = useAuth()

  // Query (nem mutation), mert így a StrictMode kettős effektje és az
  // újrarenderelés sem váltja be kétszer ugyanazt a linket.
  const verification = useQuery({
    queryKey: ['auth', 'verify-email', params.toString()],
    queryFn: async () => {
      const message = await authApi.verifyEmail(params)
      await refresh()
      return message
    },
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  })

  return (
    <AuthCard title="E-mail-cím megerősítése">
      {verification.isPending && <p className="text-slate-400">Megerősítés folyamatban…</p>}
      {verification.isSuccess && (
        <>
          <Alert kind="success">{verification.data}</Alert>
          <Link to="/feladatok" className="inline-block text-sky-400 hover:underline">
            Tovább a feladatokhoz
          </Link>
        </>
      )}
      {verification.isError && (
        <>
          <Alert kind="error">{hibaUzenet(verification.error)}</Alert>
          <p className="text-sm text-slate-400">Jelentkezz be, és kérj új megerősítő levelet a fejlécben.</p>
        </>
      )}
    </AuthCard>
  )
}
