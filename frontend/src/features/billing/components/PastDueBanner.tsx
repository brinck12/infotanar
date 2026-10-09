import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/context'
import { Banner } from '../../../shared/ui/Banner'
import { ButtonLink } from '../../../shared/ui/Button'
import * as billingApi from '../api'
import { untilDate } from '../format'

/**
 * Sikertelen megújításnál (past_due) minden oldalon jelezzük, meddig tart még
 * a hozzáférés, és hogyan rendezhető (#101). Csak bejelentkezve kérdezünk.
 */
export function PastDueBanner() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const subscription = useQuery({
    queryKey: billingApi.billingKeys.subscription,
    queryFn: ({ signal }) => billingApi.subscription(signal),
    enabled: user !== null,
    staleTime: 5 * 60_000,
  })

  // Az Előfizetés oldal maga is elmondja ugyanezt, ott nem ismételjük.
  if (!user || subscription.data?.status !== 'past_due' || pathname === '/fiok/elofizetes') return null

  return (
    <Banner
      kind="error"
      title="Nem sikerült megújítani az előfizetésed"
      className="mb-3"
      data-testid="past-due-banner"
      action={
        <ButtonLink to="/fiok/elofizetes" variant="secondary">
          Fizetés új kártyával
        </ButtonLink>
      }
    >
      A hozzáférésed {untilDate(subscription.data.grace_ends_at)} megmarad. Addig fizess egy működő kártyával, különben az előfizetés
      lezárul.
    </Banner>
  )
}
