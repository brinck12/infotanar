import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { ButtonLink } from '../../../shared/ui/Button'
import { Skeleton } from '../../../shared/ui/States'
import * as authApi from '../api'
import { AuthCard } from '../components/AuthCard'
import { useAuth } from '../context'

export function VerifyEmail() {
  const [params] = useSearchParams()
  const { user, refresh } = useAuth()

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

  if (verification.isPending) {
    return (
      <AuthCard title="E-mail megerősítése">
        <Skeleton lines={2} label="Megerősítés folyamatban…" />
      </AuthCard>
    )
  }

  if (verification.isSuccess) {
    return (
      <AuthCard icon="check" title="Az e-mail-címed megerősítve" lead={verification.data}>
        <ButtonLink to="/tanulasi-ut">Tovább a tanuláshoz</ButtonLink>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon="clock"
      iconTone="neutral"
      title="Ez a link nem érvényes"
      lead={`${hibaUzenet(verification.error)} A megerősítő linkek rövid ideig érvényesek: kérj új levelet, és a legfrissebbet használd.`}
    >
      {user ? (
        <ButtonLink to="/regisztracio/kesz">Új levél kérése</ButtonLink>
      ) : (
        <ButtonLink to="/bejelentkezes">Belépés és új levél kérése</ButtonLink>
      )}
    </AuthCard>
  )
}
