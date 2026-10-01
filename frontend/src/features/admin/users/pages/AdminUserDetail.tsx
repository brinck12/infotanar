import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { ProgressBar } from '../../../progress/components/ProgressBar'
import { QueryState } from '../../catalog/components/QueryState'
import { AdminShell, Section } from '../../components/AdminShell'
import { userQuery, type AdminUserDetail as Detail } from '../api'
import { AccessBadge } from '../components/AccessBadge'
import { formatDate } from '../format'

const SUBSCRIPTION_STATUS = { active: 'Aktív', past_due: 'Sikertelen megújítás (türelmi idő)' } as const

/** Egy felhasználó áttekintése (#50): hozzáférés és haladás; csak olvasás, fizetési adat nélkül. */
export function AdminUserDetail() {
  const id = Number(useParams().userId)
  const user = useQuery(userQuery(id))

  return <QueryState query={user}>{(data) => <UserOverview user={data} />}</QueryState>
}

function UserOverview({ user }: { user: Detail }) {
  const subscription = user.subscription

  return (
    <AdminShell
      crumbs={[{ label: 'Admin' }, { label: 'Felhasználók', to: '/admin/felhasznalok' }, { label: user.name }]}
      title={user.name}
      actions={<AccessBadge user={user} />}
    >
      <Section title="Fiók">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Item label="E-mail">{user.email}</Item>
          <Item label="Szerep">{user.role === 'admin' ? 'Admin' : 'Diák'}</Item>
          <Item label="E-mail megerősítve">{user.email_verified_at ? formatDate(user.email_verified_at) : 'Nincs megerősítve'}</Item>
          <Item label="Regisztrált">{formatDate(user.registered_at)}</Item>
          <Item label="Beadások száma">{user.submission_count}</Item>
          <Item label="Prémium hozzáférés">{user.has_premium_access ? 'Van' : 'Nincs'}</Item>
        </dl>
      </Section>

      <Section title="Előfizetés">
        {subscription ? (
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2" data-testid="admin-user-subscription">
            <Item label="Állapot">{SUBSCRIPTION_STATUS[subscription.status]}</Item>
            <Item label="Aktuális időszak">
              {formatDate(subscription.current_period_start)} – {formatDate(subscription.current_period_end)}
            </Item>
            {subscription.grace_ends_at && <Item label="Türelmi idő vége">{formatDate(subscription.grace_ends_at)}</Item>}
            <Item label="Lemondva az időszak végére">{subscription.cancel_at_period_end ? 'Igen' : 'Nem'}</Item>
          </dl>
        ) : (
          <p className="text-sm text-slate-400">Nincs élő előfizetése.</p>
        )}
        {user.access_grant && (
          <p className="mt-4 rounded-lg border border-sky-900 bg-sky-950/40 p-3 text-sm text-sky-200">
            Kézi prémium hozzáférés: „{user.access_grant.reason}”
            {user.access_grant.ends_at ? `, ${formatDate(user.access_grant.ends_at)}-ig` : ', lejárat nélkül'}.
          </p>
        )}
      </Section>

      <Section title="Haladás">
        <div className="space-y-4">
          <ProgressBar label="Összes lecke" {...user.progress} size="lg" />
          {user.progress_by_track.map((track) => (
            <ProgressBar key={track.id} label={track.title} completed={track.completed} total={track.total} percent={track.percent} />
          ))}
        </div>
      </Section>
    </AdminShell>
  )
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-100">{children}</dd>
    </div>
  )
}
