import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../../shared/api/client'

/** Egy naplózott művelet az áttekintőn. */
export interface RecentAction {
  id: number
  action: string
  /** A művelet magyar neve. */
  label: string
  /** `null`: a rendszer maga végezte. */
  actor: { id: number; name: string } | null
  subject_type: string | null
  subject_id: number | null
  created_at: string
}

/** `GET /admin/overview`: az áttekintő összes száma egy kérésben. */
export interface AdminOverviewData {
  users: { total: number; unverified: number }
  subscribers: { active: number; past_due: number }
  invoices: { attention: number }
  catalog: { tracks: number; draft_tracks: number; incomplete_rubrics: number; draft_exams: number }
  recent_actions: RecentAction[]
}

export const adminOverviewKeys = {
  all: ['admin', 'overview'] as const,
}

/** A hiányzó végpontot (404) a hívó kezeli: akkor a régi listákból áll össze az oldal. */
export const adminOverviewQuery = () =>
  queryOptions({
    queryKey: adminOverviewKeys.all,
    queryFn: async ({ signal }) => (await http.get<Envelope<AdminOverviewData>>('/admin/overview', { signal })).data.data,
    retry: false,
  })
