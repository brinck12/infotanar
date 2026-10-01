import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context'
import * as billingApi from '../api'
import { untilDate } from '../format'

/**
 * Sikertelen megújításnál (past_due) minden oldalon jelezzük, meddig tart még
 * a hozzáférés, és hogyan rendezhető (#101). Csak bejelentkezve kérdezünk.
 */
export function PastDueBanner() {
  const { user } = useAuth()
  const subscription = useQuery({
    queryKey: billingApi.billingKeys.subscription,
    queryFn: ({ signal }) => billingApi.subscription(signal),
    enabled: user !== null,
    staleTime: 5 * 60_000,
  })

  if (!user || subscription.data?.status !== 'past_due') return null

  return (
    <div role="status" className="border-b border-red-900 bg-red-950/70" data-testid="past-due-banner">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2 text-sm text-red-100">
        <span>
          Nem sikerült megújítani az előfizetésed. A hozzáférésed {untilDate(subscription.data.grace_ends_at)} megmarad.
        </span>
        <Link to="/elofizetes" className="font-medium underline hover:text-white">
          Fizetés új kártyával
        </Link>
      </div>
    </div>
  )
}
