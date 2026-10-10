import { Badge } from '../../../../shared/ui/Badge'
import type { AdminUser } from '../api'

const SUBSCRIPTION_LABEL = { active: 'Előfizető', past_due: 'Fizetési hiba' } as const

/** Előfizetés / kézi hozzáférés / ingyenes: szöveggel, nem csak színnel. */
export function AccessBadge({ user }: { user: AdminUser }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {user.subscription ? (
        <Badge kind={user.subscription.status === 'active' ? 'ok' : 'bad'}>
          {SUBSCRIPTION_LABEL[user.subscription.status]}
          {user.subscription.cancel_at_period_end ? ' (lemondva)' : ''}
        </Badge>
      ) : null}
      {user.access_grant && <Badge kind="manual">Kézi hozzáférés</Badge>}
      {!user.subscription && !user.access_grant && <Badge kind="prem">Ingyenes csomag</Badge>}
    </span>
  )
}
