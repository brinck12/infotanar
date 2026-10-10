import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../../../../shared/ui/Icon'
import { Stat } from '../../../../shared/ui/Stat'
import { tracksQuery } from '../../catalog/api'
import { AdminShell, Section } from '../../components/AdminShell'
import { adminInvoiceKeys, attentionInvoices } from '../../invoices/api'
import { usersQuery, type UserFilters } from '../../users/api'

const ALL: UserFilters = { search: '', role: '', subscription: '', verified: '', page: 1 }

/**
 * Admin áttekintés: néhány szám és a teendők. A számok a meglévő listák
 * összesítéséből jönnek (külön áttekintő végpont még nincs), ezért csak azt
 * mutatjuk, amit ezekből pontosan tudunk.
 */
export function AdminOverview() {
  const users = useQuery(usersQuery(ALL))
  const subscribers = useQuery(usersQuery({ ...ALL, subscription: 'active' }))
  const pastDue = useQuery(usersQuery({ ...ALL, subscription: 'past_due' }))
  const unverified = useQuery(usersQuery({ ...ALL, verified: '0' }))
  const invoices = useQuery({ queryKey: adminInvoiceKeys.page(1), queryFn: ({ signal }) => attentionInvoices(1, signal) })
  const tracks = useQuery(tracksQuery())

  const count = (value: number | undefined) => (value === undefined ? '–' : value.toLocaleString('hu-HU'))
  const drafts = tracks.data?.filter((track) => !track.is_published).length
  const stuckInvoices = invoices.data?.meta.total
  const todos: Array<{ icon: IconName; text: string; to: string }> = []

  if (stuckInvoices) todos.push({ icon: 'file', text: `${stuckInvoices} számla kiállítása sikertelen, újrapróbálható`, to: '/admin/szamlak' })
  if (pastDue.data?.total) {
    todos.push({ icon: 'card', text: `${pastDue.data.total} előfizetőnél sikertelen a megújítás`, to: '/admin/felhasznalok?elofizetes=past_due' })
  }
  if (unverified.data?.total) {
    todos.push({ icon: 'user', text: `${unverified.data.total} felhasználó e-mail-címe nincs megerősítve`, to: '/admin/felhasznalok?megerositve=0' })
  }
  if (drafts) todos.push({ icon: 'book', text: `${drafts} képzési ág piszkozat, a tanulók nem látják`, to: '/admin/tananyag' })

  const loading = users.isPending || invoices.isPending || tracks.isPending

  return (
    <AdminShell crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Áttekintés' }]} title="Áttekintés">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Regisztrált felhasználó" value={count(users.data?.total)} note={`ebből megerősítetlen: ${count(unverified.data?.total)}`} />
        <Stat label="Aktív előfizető" value={count(subscribers.data?.total)} note={`fizetési hibával: ${count(pastDue.data?.total)}`} />
        <Stat label="Sikertelen számla" value={count(stuckInvoices)} note="javításra vár" />
        <Stat label="Képzési ág" value={count(tracks.data?.length)} note={`ebből piszkozat: ${count(drafts)}`} />
      </div>

      <Section title="Teendők">
        {loading ? (
          <p className="text-15 text-ink-soft">Betöltés…</p>
        ) : todos.length === 0 ? (
          <p className="text-16 text-ink-soft">Nincs teendő: minden számla elkészült, és nincs elakadt fizetés.</p>
        ) : (
          <ul>
            {todos.map((todo) => (
              <TodoRow key={todo.to} icon={todo.icon} to={todo.to}>
                {todo.text}
              </TodoRow>
            ))}
          </ul>
        )}
      </Section>
    </AdminShell>
  )
}

function TodoRow({ icon, to, children }: { icon: IconName; to: string; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-grid py-1.5">
      <Icon name={icon} className="text-ink-soft" />
      <span className="min-w-0 flex-1 basis-56 text-16">{children}</span>
      <Link to={to} className="inline-flex min-h-11 items-center text-15">
        Megnyitás
      </Link>
    </li>
  )
}
