import { infiniteQueryOptions } from '@tanstack/react-query'
import { http } from '../../../shared/api/client'

/** Egy naplóbejegyzés (`GET /admin/audit-logs`, #161). */
export interface AuditEntry {
  id: number
  action: { value: string; label: string }
  /** `id: null`: a rendszer tette (pl. ütemezett feladat). A törölt fióknál nincs név és e-mail. */
  actor: { id: number | null; name: string; email: string | null; deleted: boolean }
  /** `null`, ha a műveletnek nincs tárgya. */
  subject: {
    type: string
    type_label: string
    id: number
    label: string
    /** Az admin felület útvonala; csak akkor van, ha a tárgy még létezik és van oldala. */
    admin_path: string | null
    exists: boolean
  } | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

interface AuditPage {
  data: AuditEntry[]
  next_cursor: string | null
}

/** A szűrők az URL-ben élnek, ezért szövegként; a dátum `yyyy-mm-dd` (a böngésző helyi napja). */
export interface AuditFilters {
  action: string
  actor: string
  subjectType: string
  subjectId: string
  from: string
  to: string
}

/** A `lang/hu/admin.php` `audit.actions` kulcsainak tükre: a szűrő listájához a bejegyzések előtt is kell. */
export const AUDIT_ACTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'account.exported', label: 'Fiókadatok exportálása' },
  { value: 'account.deleted', label: 'Fiók törlése' },
  { value: 'catalog.created', label: 'Tananyag létrehozása' },
  { value: 'catalog.updated', label: 'Tananyag módosítása' },
  { value: 'catalog.deleted', label: 'Tananyag törlése' },
  { value: 'catalog.reordered', label: 'Tananyag átrendezése' },
  { value: 'access.granted', label: 'Prémium hozzáférés adása' },
  { value: 'access.revoked', label: 'Prémium hozzáférés visszavonása' },
  { value: 'subscription.cancel_scheduled', label: 'Előfizetés lemondása' },
  { value: 'subscription.resumed', label: 'Előfizetés visszavonása (folytatás)' },
  { value: 'invoice.buyer_corrected', label: 'Számla vevőadatának javítása' },
  { value: 'invoice.retried', label: 'Számla újrapróbálása' },
]

/** A `audit.subjects` tükre (a morph-aliasok). */
export const AUDIT_SUBJECT_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'user', label: 'Felhasználó' },
  { value: 'track', label: 'Képzési ág' },
  { value: 'module', label: 'Modul' },
  { value: 'lesson', label: 'Lecke' },
  { value: 'exercise', label: 'Feladat' },
  { value: 'test_case', label: 'Teszteset' },
  { value: 'subscription', label: 'Előfizetés' },
  { value: 'invoice', label: 'Számla' },
]

export const EMPTY_FILTERS: AuditFilters = { action: '', actor: '', subjectType: '', subjectId: '', from: '', to: '' }

/** Egy helyi nap éjfele ISO-pillanatként: a backendnek nem kell tudnia a böngésző időzónáját. */
function localMidnight(day: string, addDays = 0): string {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number)
  return new Date(year, month - 1, date + addDays).toISOString()
}

function apiParams(filters: AuditFilters, cursor: string | null): Record<string, string> {
  const params: Record<string, string | undefined> = {
    action: filters.action || undefined,
    actor_id: filters.actor || undefined,
    subject_type: filters.subjectType || undefined,
    subject_id: filters.subjectType ? filters.subjectId || undefined : undefined,
    from: filters.from ? localMidnight(filters.from) : undefined,
    // A "ig" nap még beletartozik: a következő nap éjfele a (nyitott) felső határ.
    to: filters.to ? localMidnight(filters.to, 1) : undefined,
    cursor: cursor ?? undefined,
  }

  return Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined))
}

export const auditLogsQuery = (filters: AuditFilters) =>
  infiniteQueryOptions({
    queryKey: ['admin', 'audit-logs', filters] as const,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => (await http.get<AuditPage>('/admin/audit-logs', { params: apiParams(filters, pageParam), signal })).data,
    getNextPageParam: (last) => last.next_cursor,
  })

/** Az "Előzmények" link: a napló az adott tárgyra szűrve. */
export function historyPath(subjectType: string, subjectId: number): string {
  return `/admin/naplo?${new URLSearchParams({ tipus: subjectType, targy: String(subjectId) }).toString()}`
}
