import { StatusPill } from '../../components/AdminShell'
import type { AdminUser } from '../api'

const SUBSCRIPTION_LABEL = { active: 'Előfizető', past_due: 'Lejárt fizetés' } as const

/** Előfizetés / kézi hozzáférés / ingyenes: szöveggel, nem csak színnel. */
export function AccessBadge({ user }: { user: AdminUser }) {
  return (
    <span className="flex flex-wrap gap-1">
      {user.subscription ? (
        <StatusPill tone={user.subscription.status === 'active' ? 'published' : 'draft'}>
          {SUBSCRIPTION_LABEL[user.subscription.status]}
          {user.subscription.cancel_at_period_end ? ' (lemondva)' : ''}
        </StatusPill>
      ) : null}
      {user.access_grant && <StatusPill tone="free">Kézi hozzáférés</StatusPill>}
      {!user.subscription && !user.access_grant && <StatusPill tone="info">Ingyenes</StatusPill>}
    </span>
  )
}

