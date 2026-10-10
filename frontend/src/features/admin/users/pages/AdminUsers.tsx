import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '../../../../shared/ui/Badge'
import { cx } from '../../../../shared/ui/cx'
import { Field, SelectField } from '../../../../shared/ui/Form'
import { Pager } from '../../../../shared/ui/Pager'
import { Bar } from '../../../../shared/ui/Progress'
import { LoadError, Skeleton } from '../../../../shared/ui/States'
import { Table, Td, Th, Tr } from '../../../../shared/ui/Table'
import { AdminShell } from '../../components/AdminShell'
import { usersQuery, type UserFilters } from '../api'
import { AccessBadge } from '../components/AccessBadge'
import { formatDate } from '../format'

const SEARCH_DELAY_MS = 300

function readFilters(params: URLSearchParams): UserFilters {
  const pick = <T extends string>(key: string, allowed: readonly T[]): T | '' => {
    const value = params.get(key) ?? ''
    return (allowed as readonly string[]).includes(value) ? (value as T) : ''
  }
  const page = Number(params.get('oldal') ?? '1')

  return {
    search: params.get('kereses') ?? '',
    role: pick('szerep', ['student', 'admin'] as const),
    subscription: pick('elofizetes', ['active', 'past_due', 'none'] as const),
    verified: pick('megerositve', ['1', '0'] as const),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

const PARAM: Record<keyof UserFilters, string> = {
  search: 'kereses',
  role: 'szerep',
  subscription: 'elofizetes',
  verified: 'megerositve',
  page: 'oldal',
}

const SUBSCRIPTION_OPTIONS = [
  { value: '', label: 'Mind' },
  { value: 'active', label: 'Aktív' },
  { value: 'past_due', label: 'Fizetési hiba' },
  { value: 'none', label: 'Nincs előfizetés' },
] as const

const ROLE_OPTIONS = [
  { value: '', label: 'Mind' },
  { value: 'student', label: 'Tanuló' },
  { value: 'admin', label: 'Admin' },
] as const

const VERIFIED_OPTIONS = [
  { value: '', label: 'Mind' },
  { value: '1', label: 'Megerősítve' },
  { value: '0', label: 'Nincs megerősítve' },
] as const

/**
 * Felhasználók áttekintése (#50): keresés és szűrés, előfizetési státusz és
 * haladás egy pillantásra. A szűrők az URL-ben élnek (megosztható, vissza-
 * gombbal is működik). Fizetési adat nem jelenik meg, csak státusz és dátum.
 */
export function AdminUsers() {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const users = useQuery(usersQuery(filters))
  const [search, setSearch] = useState(filters.search)

  function update(changes: Partial<UserFilters>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries({ ...changes, page: changes.page ?? 1 }) as Array<[keyof UserFilters, string | number]>) {
      if (value === '' || (key === 'page' && value === 1)) next.delete(PARAM[key])
      else next.set(PARAM[key], String(value))
    }
    setParams(next, { replace: true })
  }

  // Gépelés közben ritkítva keresünk; unmountkor a függő keresés elmarad.
  const searchTimer = useRef<number | null>(null)
  useEffect(() => () => {
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current)
  }, [])

  function onSearch(value: string) {
    setSearch(value)
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => update({ search: value }), SEARCH_DELAY_MS)
  }

  return (
    <AdminShell crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Felhasználók' }]} title="Felhasználók">
      <div className="flex flex-wrap items-start gap-4" role="search">
        <Field
          className="flex-1 basis-64"
          label="Keresés névre vagy e-mail-címre"
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <SelectField
          className="w-48"
          label="Előfizetés"
          options={SUBSCRIPTION_OPTIONS}
          value={filters.subscription}
          onChange={(e) => update({ subscription: e.target.value as UserFilters['subscription'] })}
        />
        <SelectField
          className="w-36"
          label="Szerepkör"
          options={ROLE_OPTIONS}
          value={filters.role}
          onChange={(e) => update({ role: e.target.value as UserFilters['role'] })}
        />
        <SelectField
          className="w-52"
          label="E-mail-cím"
          options={VERIFIED_OPTIONS}
          value={filters.verified}
          onChange={(e) => update({ verified: e.target.value as UserFilters['verified'] })}
        />
      </div>

      {users.isError ? (
        <LoadError error={users.error} onRetry={() => void users.refetch()} />
      ) : !users.data ? (
        <Skeleton lines={5} />
      ) : (
        <div className={cx(users.isPlaceholderData && 'opacity-60')}>
          <p className="mb-2 text-15 text-ink-soft" aria-live="polite">
            {users.data.total} felhasználó
          </p>
          <Table caption="Felhasználók">
            <thead>
              <tr>
                <Th>Felhasználó</Th>
                <Th>Hozzáférés</Th>
                <Th>Haladás</Th>
                <Th>Regisztrált</Th>
              </tr>
            </thead>
            <tbody>
              {users.data.data.map((user) => (
                <Tr key={user.id}>
                  <Td data-testid="admin-user-row">
                    <Link to={`/admin/felhasznalok/${user.id}`} className="inline-flex min-h-8 items-center font-semibold text-ink">
                      {user.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-14 text-ink-soft">
                      {user.email}
                      {user.role === 'admin' && <Badge kind="admin">Admin</Badge>}
                      {!user.email_verified_at && <Badge kind="draft">Nincs megerősítve</Badge>}
                    </div>
                  </Td>
                  <Td>
                    <AccessBadge user={user} />
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <Bar value={user.progress.percent} label={`Haladás: ${user.progress.percent} százalék`} className="w-24" />
                      {user.progress.percent}%
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-ink-soft">{formatDate(user.registered_at)}</Td>
                </Tr>
              ))}
              {users.data.data.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-6 text-center text-ink-soft">
                    Nincs a szűrésnek megfelelő felhasználó. Módosítsd a keresést vagy a szűrőket.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>

          <Pager page={users.data.current_page} lastPage={users.data.last_page} onChange={(page) => update({ ...filters, page })} />
        </div>
      )}
    </AdminShell>
  )
}
