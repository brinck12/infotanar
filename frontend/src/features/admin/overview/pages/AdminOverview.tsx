import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../../../../shared/ui/Icon'
import { Stat } from '../../../../shared/ui/Stat'
import { tracksQuery } from '../../catalog/api'
import { AdminShell, Section } from '../../components/AdminShell'
import { adminInvoiceKeys, attentionInvoices } from '../../invoices/api'
import { usersQuery, type UserFilters } from '../../users/api'
import { adminOverviewQuery } from '../api'

const ALL: UserFilters = { search: '', role: '', subscription: '', verified: '', page: 1 }

interface Figures {
  users?: number
  unverified?: number
  active?: number
  pastDue?: number
  stuckInvoices?: number
  tracks?: number
  draftTracks?: number
  /** Csak az áttekintő végpontból jön. */
  incompleteRubrics?: number
  draftExams?: number
}

/**
 * Admin áttekintés: néhány szám és a teendők. A számokat az áttekintő végpont
 * adja egy kérésben; ha az nem érhető el, a meglévő listák összesítéséből
 * állnak össze (azokból csak azt tudjuk, ami pontosan kiolvasható).
 */
export function AdminOverview() {
  const overview = useQuery(adminOverviewQuery())
  const fallback = overview.isError
  const users = useQuery({ ...usersQuery(ALL), enabled: fallback })
  const subscribers = useQuery({ ...usersQuery({ ...ALL, subscription: 'active' }), enabled: fallback })
  const pastDue = useQuery({ ...usersQuery({ ...ALL, subscription: 'past_due' }), enabled: fallback })
  const unverified = useQuery({ ...usersQuery({ ...ALL, verified: '0' }), enabled: fallback })
  const invoices = useQuery({ queryKey: adminInvoiceKeys.page(1), queryFn: ({ signal }) => attentionInvoices(1, signal), enabled: fallback })
  const tracks = useQuery({ ...tracksQuery(), enabled: fallback })

  const figures: Figures = overview.data
    ? {
        users: overview.data.users.total,
        unverified: overview.data.users.unverified,
        active: overview.data.subscribers.active,
        pastDue: overview.data.subscribers.past_due,
        stuckInvoices: overview.data.invoices.attention,
        tracks: overview.data.catalog.tracks,
        draftTracks: overview.data.catalog.draft_tracks,
        incompleteRubrics: overview.data.catalog.incomplete_rubrics,
        draftExams: overview.data.catalog.draft_exams,
      }
    : {
        users: users.data?.total,
        unverified: unverified.data?.total,
        active: subscribers.data?.total,
        pastDue: pastDue.data?.total,
        stuckInvoices: invoices.data?.meta.total,
        tracks: tracks.data?.length,
        draftTracks: tracks.data?.filter((track) => !track.is_published).length,
      }

  const count = (value: number | undefined) => (value === undefined ? '–' : value.toLocaleString('hu-HU'))
  const todos: Array<{ icon: IconName; text: string; to: string }> = []

  if (figures.stuckInvoices) todos.push({ icon: 'file', text: `${figures.stuckInvoices} számla kiállítása sikertelen, újrapróbálható`, to: '/admin/szamlak' })
  if (figures.pastDue) {
    todos.push({ icon: 'card', text: `${figures.pastDue} előfizetőnél sikertelen a megújítás`, to: '/admin/felhasznalok?elofizetes=past_due' })
  }
  if (figures.unverified) {
    todos.push({ icon: 'user', text: `${figures.unverified} felhasználó e-mail-címe nincs megerősítve`, to: '/admin/felhasznalok?megerositve=0' })
  }
  if (figures.draftTracks) todos.push({ icon: 'book', text: `${figures.draftTracks} képzési ág piszkozat, a tanulók nem látják`, to: '/admin/tananyag' })
  if (figures.incompleteRubrics) {
    todos.push({ icon: 'file', text: `${figures.incompleteRubrics} feladathoz hiányzik az értékelőlap`, to: '/admin/tananyag' })
  }
  if (figures.draftExams) todos.push({ icon: 'file', text: `${figures.draftExams} gyakorló vizsga piszkozat, a tanulók nem látják`, to: '/admin/vizsgak' })

  const loading = fallback ? users.isPending || invoices.isPending || tracks.isPending : overview.isPending
  const recent = overview.data?.recent_actions ?? []

  return (
    <AdminShell crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Áttekintés' }]} title="Áttekintés">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Regisztrált felhasználó" value={count(figures.users)} note={`ebből megerősítetlen: ${count(figures.unverified)}`} />
        <Stat label="Aktív előfizető" value={count(figures.active)} note={`fizetési hibával: ${count(figures.pastDue)}`} />
        <Stat label="Sikertelen számla" value={count(figures.stuckInvoices)} note="javításra vár" />
        <Stat label="Képzési ág" value={count(figures.tracks)} note={`ebből piszkozat: ${count(figures.draftTracks)}`} />
        {overview.data && (
          <>
            <Stat label="Hiányos értékelőlap" value={count(figures.incompleteRubrics)} note="feltöltéses feladat vagy vizsgarész" />
            <Stat label="Piszkozat vizsga" value={count(figures.draftExams)} note="a tanulók nem látják" />
          </>
        )}
      </div>

      <Section title="Teendők">
        {loading ? (
          <p className="text-15 text-ink-soft">Betöltés…</p>
        ) : todos.length === 0 ? (
          <p className="text-16 text-ink-soft">Nincs teendő: minden számla elkészült, és nincs elakadt fizetés.</p>
        ) : (
          <ul>
            {todos.map((todo) => (
              <TodoRow key={todo.text} icon={todo.icon} to={todo.to}>
                {todo.text}
              </TodoRow>
            ))}
          </ul>
        )}
      </Section>

      {recent.length > 0 && (
        <Section title="Legutóbbi műveletek">
          <ul>
            {recent.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 border-t border-grid py-1.5 text-15">
                <span className="min-w-0 flex-1 basis-56 text-16">{entry.label}</span>
                <span className="text-ink-soft">{entry.actor?.name ?? 'Rendszer'}</span>
                <time dateTime={entry.created_at} className="text-ink-soft">
                  {new Date(entry.created_at).toLocaleString('hu-HU')}
                </time>
              </li>
            ))}
          </ul>
        </Section>
      )}
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
