import { useInfiniteQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../../shared/api/errors'
import { Alert } from '../../../../shared/ui/Form'
import { AdminShell } from '../../components/AdminShell'
import { AUDIT_ACTIONS, AUDIT_SUBJECT_TYPES, auditLogsQuery, EMPTY_FILTERS, type AuditEntry, type AuditFilters } from '../api'
import { MetadataList } from '../components/MetadataList'

/** URL-paraméter (magyar, megosztható) ↔ szűrő. */
const PARAM: Record<keyof AuditFilters, string> = {
  action: 'muvelet',
  actor: 'szereplo',
  subjectType: 'tipus',
  subjectId: 'targy',
  from: 'tol',
  to: 'ig',
}

const dateTime = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'medium' })

function readFilters(params: URLSearchParams): AuditFilters {
  return Object.fromEntries(
    (Object.keys(EMPTY_FILTERS) as Array<keyof AuditFilters>).map((key) => [key, params.get(PARAM[key]) ?? '']),
  ) as unknown as AuditFilters
}

/**
 * Napló (#161): ki, mikor, mit csinált. Csak olvasható; a szűrők az URL-ben élnek (megosztható,
 * a visszagomb is működik). A bejegyzések kurzorral lapozódnak, a "Továbbiak" a következő oldalt tölti.
 */
export function AdminAuditLog() {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const log = useInfiniteQuery(auditLogsQuery(filters))
  const entries = log.data?.pages.flatMap((page) => page.data) ?? []

  function update(changes: Partial<AuditFilters>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes) as Array<[keyof AuditFilters, string]>) {
      if (value === '') next.delete(PARAM[key])
      else next.set(PARAM[key], value)
    }
    // A tárgy azonosítója típus nélkül nem értelmezhető.
    if (!next.get(PARAM.subjectType)) next.delete(PARAM.subjectId)
    setParams(next, { replace: true })
  }

  const hasFilter = Object.values(filters).some((value) => value !== '')
  const field = 'rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100'

  return (
    <AdminShell crumbs={[{ label: 'Admin' }, { label: 'Napló' }]} title="Napló">
      <div className="flex flex-wrap items-end gap-3" role="search">
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Művelet</span>
          <select className={field} value={filters.action} onChange={(e) => update({ action: e.target.value })}>
            <option value="">Mind</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Tárgy típusa</span>
          <select className={field} value={filters.subjectType} onChange={(e) => update({ subjectType: e.target.value })}>
            <option value="">Mind</option>
            {AUDIT_SUBJECT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Tárgy azonosítója</span>
          <input
            type="number"
            min={1}
            className={`${field} w-32`}
            value={filters.subjectId}
            disabled={filters.subjectType === ''}
            onChange={(e) => update({ subjectId: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Szereplő azonosítója</span>
          <input type="number" min={1} className={`${field} w-32`} value={filters.actor} onChange={(e) => update({ actor: e.target.value })} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Ettől a naptól</span>
          <input type="date" className={field} value={filters.from} onChange={(e) => update({ from: e.target.value })} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Eddig a napig</span>
          <input type="date" className={field} value={filters.to} onChange={(e) => update({ to: e.target.value })} />
        </label>
        {hasFilter && (
          <button type="button" onClick={() => setParams({}, { replace: true })} className="rounded-lg px-3 py-2 text-sm text-sky-300 hover:bg-slate-800">
            Szűrők törlése
          </button>
        )}
      </div>

      {log.isError ? (
        <Alert kind="error">{hibaUzenet(log.error)}</Alert>
      ) : log.isPending ? (
        <p className="text-sm text-slate-400">Betöltés…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-400" data-testid="audit-empty">
          {hasFilter ? 'Nincs a szűrésnek megfelelő bejegyzés.' : 'A napló még üres.'}
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-400" aria-live="polite">
            {entries.length} bejegyzés{log.hasNextPage ? ' (van több)' : ''}
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-sm" data-testid="audit-table">
              <caption className="sr-only">Napló, legfrissebb elöl</caption>
              <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {['Időpont', 'Szereplő', 'Művelet', 'Tárgy', 'IP', 'Részletek'].map((heading) => (
                    <th key={heading} scope="col" className="px-3 py-2 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <Row key={entry.id} entry={entry} onFilterActor={(id) => update({ actor: String(id) })} />
                ))}
              </tbody>
            </table>
          </div>
          {log.hasNextPage && (
            <button
              type="button"
              disabled={log.isFetchingNextPage}
              onClick={() => void log.fetchNextPage()}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
            >
              {log.isFetchingNextPage ? 'Betöltés…' : 'Továbbiak betöltése'}
            </button>
          )}
        </>
      )}
    </AdminShell>
  )
}

function Row({ entry, onFilterActor }: { entry: AuditEntry; onFilterActor: (actorId: number) => void }) {
  const { actor, subject } = entry

  return (
    <tr className="border-t border-slate-800 align-top" data-testid="audit-row" data-action={entry.action.value}>
      <td className="whitespace-nowrap px-3 py-2 text-slate-300">
        <time dateTime={entry.created_at}>{dateTime.format(new Date(entry.created_at))}</time>
      </td>
      <td className="px-3 py-2">
        {actor.id === null ? (
          <span className="text-slate-400">{actor.name}</span>
        ) : (
          <>
            <button type="button" onClick={() => onFilterActor(actor.id as number)} title="Szűrés erre a szereplőre" className={`text-left hover:underline ${actor.deleted ? 'text-slate-400' : 'text-sky-300'}`}>
              {actor.name}
            </button>
            {actor.email && <p className="text-xs text-slate-400">{actor.email}</p>}
          </>
        )}
      </td>
      <td className="px-3 py-2 text-slate-100">{entry.action.label}</td>
      <td className="px-3 py-2">
        {subject === null ? (
          <span className="text-slate-400">–</span>
        ) : (
          <>
            <span className="text-xs text-slate-400">{subject.type_label}</span>
            <p>
              {subject.admin_path ? (
                <Link to={subject.admin_path} className="text-sky-300 hover:underline">
                  {subject.label}
                </Link>
              ) : (
                <span className={subject.exists ? 'text-slate-200' : 'text-slate-400'}>
                  {subject.label}
                  {!subject.exists && ' – törölve'}
                </span>
              )}
            </p>
          </>
        )}
      </td>
      <td className="px-3 py-2 font-mono text-xs text-slate-400">{entry.ip_address ?? '–'}</td>
      <td className="px-3 py-2">
        {entry.metadata ? (
          <details>
            <summary className="cursor-pointer text-sky-300">Részletek</summary>
            <div className="mt-2 max-w-md">
              <MetadataList value={entry.metadata} />
            </div>
          </details>
        ) : (
          <span className="text-slate-400">–</span>
        )}
      </td>
    </tr>
  )
}
