import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { Banner } from '../../../../shared/ui/Banner'
import { Bar } from '../../../../shared/ui/Progress'
import { QueryState } from '../../catalog/components/QueryState'
import { AdminShell, Section } from '../../components/AdminShell'
import { userQuery, type AdminUserDetail as Detail } from '../api'
import { AccessBadge } from '../components/AccessBadge'
import { AccessGrants } from '../components/AccessGrants'
import { UserActions } from '../components/UserActions'
import { UserPayments } from '../components/UserPayments'
import { formatDate } from '../format'

const SUBSCRIPTION_STATUS = { active: 'Aktív', past_due: 'Sikertelen megújítás (türelmi idő)' } as const

/** Egy felhasználó áttekintése (#50), kézi hozzáférése (#51), kezelése és fizetései (#162). */
export function AdminUserDetail() {
  const id = Number(useParams().userId)
  const user = useQuery(userQuery(id))

  return <QueryState query={user}>{(data) => <UserOverview user={data} />}</QueryState>
}

function UserOverview({ user }: { user: Detail }) {
  const subscription = user.subscription

  return (
    <AdminShell
      crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Felhasználók', to: '/admin/felhasznalok' }, { label: user.name }]}
      title={user.name}
      actions={<AccessBadge user={user} />}
    >
      <Section title="Fiók">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Item label="E-mail-cím">{user.email}</Item>
          <Item label="Szerepkör">{user.role === 'admin' ? 'Admin' : 'Tanuló'}</Item>
          <Item label="E-mail megerősítve">{user.email_verified_at ? formatDate(user.email_verified_at) : 'Nincs megerősítve'}</Item>
          <Item label="Regisztrált">{formatDate(user.registered_at)}</Item>
          <Item label="Beadások száma">{user.submission_count}</Item>
          <Item label="Prémium hozzáférés">{user.has_premium_access ? 'Van' : 'Nincs'}</Item>
        </dl>
      </Section>

      <Section title="Előfizetés">
        {subscription ? (
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2" data-testid="admin-user-subscription">
            <Item label="Állapot">{SUBSCRIPTION_STATUS[subscription.status]}</Item>
            <Item label="Aktuális időszak">
              {formatDate(subscription.current_period_start)} – {formatDate(subscription.current_period_end)}
            </Item>
            {subscription.grace_ends_at && <Item label="Türelmi idő vége">{formatDate(subscription.grace_ends_at)}</Item>}
            <Item label="Lemondva az időszak végére">{subscription.cancel_at_period_end ? 'Igen' : 'Nem'}</Item>
          </dl>
        ) : (
          <p className="text-15 text-ink-soft">Nincs élő előfizetése.</p>
        )}
        {user.access_grant && (
          <Banner kind="info" title="Kézi prémium hozzáférés" className="mt-4">
            „{user.access_grant.reason}”
            {user.access_grant.ends_at ? `, lejár: ${formatDate(user.access_grant.ends_at)}` : ', lejárat nélkül'}.
          </Banner>
        )}
      </Section>

      <Section title="Kézi prémium hozzáférés">
        <AccessGrants userId={user.id} />
      </Section>

      <Section title="Műveletek">
        <UserActions user={user} />
      </Section>

      <Section title="Fizetések">
        <UserPayments userId={user.id} />
      </Section>

      <Section title="Haladás">
        <ul className="flex flex-col gap-4">
          <ProgressRow label="Összes lecke" {...user.progress} />
          {user.progress_by_track.map((track) => (
            <ProgressRow key={track.id} label={track.title} completed={track.completed} total={track.total} percent={track.percent} />
          ))}
        </ul>
      </Section>
    </AdminShell>
  )
}

function ProgressRow({ label, completed, total, percent }: { label: string; completed: number; total: number; percent: number }) {
  return (
    <li>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-16">
        <span className="font-semibold">{label}</span>
        <span className="text-15 text-ink-soft">
          {completed} / {total} lecke, {percent}%
        </span>
      </div>
      <Bar value={percent} label={`${label}: ${percent} százalék`} className="mt-2" />
    </li>
  )
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-14 text-ink-soft">{label}</dt>
      <dd className="text-16 font-medium">{children}</dd>
    </div>
  )
}
