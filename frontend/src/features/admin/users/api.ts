import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../../shared/api/client'
import type { ProgressSummary, Role, SubscriptionStatus, TrackProgress } from '../../../types'

/** Admin felhasználói áttekintés (#50). Fizetési adat nincs benne, csak státusz és dátumok. */
export interface AdminUserSubscription {
  status: Exclude<SubscriptionStatus, 'canceled'>
  current_period_start: string | null
  current_period_end: string | null
  grace_ends_at: string | null
  cancel_at_period_end: boolean
}

export interface AdminUserAccessGrant {
  id: number
  reason: string
  ends_at: string | null
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role: Role
  email_verified_at: string | null
  registered_at: string | null
  has_premium_access: boolean
  subscription: AdminUserSubscription | null
  access_grant: AdminUserAccessGrant | null
  progress: ProgressSummary
}

export interface AdminUserDetail extends AdminUser {
  submission_count: number
  progress_by_track: TrackProgress[]
}

export interface UserFilters {
  search: string
  role: '' | Role
  subscription: '' | 'active' | 'past_due' | 'none'
  verified: '' | '1' | '0'
  page: number
}

interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  list: (filters: UserFilters) => [...adminUserKeys.all, 'list', filters] as const,
  detail: (id: number) => [...adminUserKeys.all, 'detail', id] as const,
}

export const usersQuery = (filters: UserFilters) =>
  queryOptions({
    queryKey: adminUserKeys.list(filters),
    queryFn: async ({ signal }) => {
      // Üres szűrő ne kerüljön a query stringbe (a backend validálja az értékeket).
      const params = Object.fromEntries(Object.entries({ ...filters, per_page: 25 }).filter(([, v]) => v !== '' && v !== null))
      return (await http.get<Paginated<AdminUser>>('/admin/users', { params, signal })).data
    },
    // Lapozás és szűrés közben az előző lista látszik, nem villan üresre.
    placeholderData: keepPreviousData,
  })

export const userQuery = (id: number) =>
  queryOptions({
    queryKey: adminUserKeys.detail(id),
    queryFn: async ({ signal }) => (await http.get<Envelope<AdminUserDetail>>(`/admin/users/${id}`, { signal })).data.data,
  })

/** Kézi prémium hozzáférés (#51) története; ki adta ki és ki vonta vissza. */
export interface AccessGrant {
  id: number
  reason: string
  active: boolean
  ends_at: string | null
  granted_at: string | null
  granted_by: { id: number; name: string } | null
  revoked_at: string | null
  revoked_by: { id: number; name: string } | null
}

export const accessGrantsQuery = (userId: number) =>
  queryOptions({
    queryKey: [...adminUserKeys.detail(userId), 'access-grants'] as const,
    queryFn: async ({ signal }) =>
      (await http.get<Envelope<AccessGrant[]>>(`/admin/users/${userId}/access-grants`, { signal })).data.data,
  })

export async function grantAccess(userId: number, payload: { reason: string; ends_at: string | null }): Promise<AccessGrant> {
  return (await http.post<Envelope<AccessGrant>>(`/admin/users/${userId}/access-grants`, payload)).data.data
}

export async function revokeAccess(grantId: number): Promise<void> {
  await http.delete(`/admin/access-grants/${grantId}`)
}
