import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { ButtonLink } from '../../../shared/ui/Button'
import { Skeleton } from '../../../shared/ui/States'
import { AuthCard } from '../../auth/components/AuthCard'
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

  if (confirmation.isPending) {
    return (
      <AuthCard title="E-mail-cím módosítása">
        <title>E-mail-cím módosítása – InfoTanár</title>
        <Skeleton lines={2} label="Megerősítés folyamatban…" />
      </AuthCard>
    )
  }

  if (confirmation.isSuccess) {
    return (
      <AuthCard icon="check" title="Az új e-mail-címed él" lead={`${confirmation.data} Mostantól az új címeddel tudsz belépni.`}>
        <title>E-mail-cím módosítása – InfoTanár</title>
        {user ? <ButtonLink to="/fiok">Vissza a fiókomhoz</ButtonLink> : <ButtonLink to="/bejelentkezes">Belépés</ButtonLink>}
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon="clock"
      iconTone="neutral"
      title="Ez a link nem érvényes"
      lead={`${hibaUzenet(confirmation.error)} A link lejárt, vagy már felhasználták. A fiókodban új cserét kérhetsz.`}
    >
      <title>E-mail-cím módosítása – InfoTanár</title>
      {user ? <ButtonLink to="/fiok#email">Új csere kérése</ButtonLink> : <ButtonLink to="/bejelentkezes">Belépés és új csere kérése</ButtonLink>}
    </AuthCard>
  )
}
