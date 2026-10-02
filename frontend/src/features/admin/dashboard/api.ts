import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../../shared/api/client'

export type DashboardRangeKey = '7d' | '30d' | '90d'

/** Az admin áttekintés mutatói (`GET /admin/metrics`); a definíciók: docs/architecture.md. */
export interface DashboardMetrics {
  range: { key: DashboardRangeKey; days: string[]; timezone: string; generated_at: string }
  subscriptions: {
    active: number
    past_due: number
    cancelling: number
    new: number
    new_previous: number
    churned: number
    churned_previous: number
    mrr_huf: number
  }
  revenue: {
    /** Nap (`Y-m-d`) → bruttó forint. */
    daily: Record<string, number>
    total: number
    total_previous: number
    failed: number
    failed_previous: number
  }
  users: {
    daily: Record<string, number>
    registered: number
    registered_previous: number
    verified_ratio: number | null
    conversion: number | null
    conversion_previous: number | null
  }
  learning: {
    submissions_daily: Record<string, number>
    active_learners_daily: Record<string, number>
    submissions: number
    submissions_previous: number
    active_learners: number
    active_learners_previous: number
    acceptance_rate: number | null
    acceptance_rate_previous: number | null
    /** Állapot (`accepted`, `wrong_answer`, …) → darabszám. */
    verdicts: Record<string, number>
  }
  attention: {
    failed_invoices: number
    stale_payments: number
    failed_jobs: number
    unsolved_exercises: Array<{ id: number; title: string; attempts: number }>
  }
}

export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  range: (range: DashboardRangeKey) => [...dashboardKeys.all, range] as const,
}

export const dashboardQuery = (range: DashboardRangeKey) =>
  queryOptions({
    queryKey: dashboardKeys.range(range),
    queryFn: async ({ signal }) => (await http.get<Envelope<DashboardMetrics>>('/admin/metrics', { params: { range }, signal })).data.data,
    // A backend 5 percig gyorsítótáraz, a böngésző ennyi ideig nem kérdez újra.
    staleTime: 60_000,
  })
