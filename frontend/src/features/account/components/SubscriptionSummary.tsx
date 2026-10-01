import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { Subscription } from '../../../types'
import * as billingApi from '../../billing/api'
import { formatDate, untilDate } from '../../billing/format'
import { AccountSection } from './AccountSection'

function describe(subscription: Subscription | null): string {
  if (!subscription) return 'Nincs előfizetésed: az ingyenes leckék érhetők el.'

  if (subscription.status === 'past_due') {
    return `Nem sikerült megújítani. A hozzáférésed ${untilDate(subscription.grace_ends_at)} megmarad.`
  }

  return subscription.cancel_at_period_end
    ? `Lemondva: ${untilDate(subscription.current_period_end)} minden elérhető, utána nem terhelünk.`
    : `Aktív. A következő megújítás: ${formatDate(subscription.current_period_end)}`
}

/** Az előfizetés állapota egy mondatban; a kezelése az Előfizetés oldalon történik. */
export function SubscriptionSummary() {
  const subscription = useQuery({
    queryKey: billingApi.billingKeys.subscription,
    queryFn: ({ signal }) => billingApi.subscription(signal),
  })

  return (
    <AccountSection title="Előfizetés">
      {subscription.isPending && <p className="text-slate-400">Betöltés…</p>}
      {subscription.isError && <p className="text-red-300">Az előfizetés állapotát most nem sikerült lekérdezni.</p>}
      {subscription.isSuccess && <p>{describe(subscription.data)}</p>}
      <Link
        to="/elofizetes"
        className="inline-block rounded-sm text-sky-400 underline underline-offset-2 hover:text-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        {subscription.data ? 'Előfizetés kezelése' : 'Előfizetek'}
      </Link>
    </AccountSection>
  )
}
