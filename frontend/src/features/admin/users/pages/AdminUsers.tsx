import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../../shared/api/errors'
import { Alert } from '../../../../shared/ui/Form'
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

  const select = 'rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100'

  return (
    <AdminShell crumbs={[{ label: 'Admin' }, { label: 'Felhasználók' }]} title="Felhasználók">
      <div className="flex flex-wrap items-end gap-3" role="search">
        <label className="min-w-60 flex-1 text-sm">
          <span className="mb-1 block text-slate-400">Keresés névre vagy e-mailre</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Előfizetés</span>
          <select className={select} value={filters.subscription} onChange={(e) => update({ subscription: e.target.value as UserFilters['subscription'] })}>
            <option value="">Mind</option>
            <option value="active">Aktív</option>
            <option value="past_due">Lejárt fizetés</option>
            <option value="none">Nincs előfizetés</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Szerep</span>
          <select className={select} value={filters.role} onChange={(e) => update({ role: e.target.value as UserFilters['role'] })}>
            <option value="">Mind</option>
            <option value="student">Diák</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">E-mail</span>
          <select className={select} value={filters.verified} onChange={(e) => update({ verified: e.target.value as UserFilters['verified'] })}>
            <option value="">Mind</option>
            <option value="1">Megerősítve</option>
            <option value="0">Nincs megerősítve</option>
          </select>
        </label>
      </div>

      {users.isError ? (
        <Alert kind="error">{hibaUzenet(users.error)}</Alert>
      ) : !users.data ? (
        <p className="text-sm text-slate-400">Betöltés…</p>
      ) : (
        <div className={users.isPlaceholderData ? 'opacity-60 transition' : 'transition'}>
          <p className="mb-2 text-sm text-slate-400" aria-live="polite">
            {users.data.total} felhasználó
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th scope="col" className="px-3 py-2">Felhasználó</th>
                  <th scope="col" className="px-3 py-2">Hozzáférés</th>
                  <th scope="col" className="px-3 py-2">Haladás</th>
                  <th scope="col" className="px-3 py-2">Regisztrált</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.data.data.map((user) => (
                  <tr key={user.id} data-testid="admin-user-row">
                    <td className="px-3 py-2">
                      <Link to={`/admin/felhasznalok/${user.id}`} className="font-medium text-slate-100 hover:text-sky-300 hover:underline">
                        {user.name}
                      </Link>
                      <div className="text-xs text-slate-400">
                        {user.email}
                        {user.role === 'admin' && ' · admin'}
                        {!user.email_verified_at && ' · nincs megerősítve'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <AccessBadge user={user} />
                    </td>
                    <td className="px-3 py-2">
                      <span className="mr-2 inline-block h-1.5 w-24 overflow-hidden rounded-full bg-slate-800 align-middle" aria-hidden="true">
                        <span className="block h-full bg-sky-500" style={{ width: `${user.progress.percent}%` }} />
                      </span>
                      <span className="sr-only">Haladás: </span>
                      {user.progress.percent}%
                    </td>
                    <td className="px-3 py-2 text-slate-400">{formatDate(user.registered_at)}</td>
                  </tr>
                ))}
                {users.data.data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                      Nincs a szűrésnek megfelelő felhasználó.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {users.data.last_page > 1 && (
            <nav aria-label="Lapozás" className="mt-3 flex items-center justify-between text-sm">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => update({ ...filters, page: filters.page - 1 })}
                className="rounded px-3 py-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              >
                ← Előző
              </button>
              <span className="text-slate-400">
                {users.data.current_page}. / {users.data.last_page} oldal
              </span>
              <button
                type="button"
                disabled={filters.page >= users.data.last_page}
                onClick={() => update({ ...filters, page: filters.page + 1 })}
                className="rounded px-3 py-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              >
                Következő →
              </button>
            </nav>
          )}
        </div>
      )}
    </AdminShell>
  )
}
