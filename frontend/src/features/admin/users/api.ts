import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../../shared/api/client'
import { saveBlob } from '../../../shared/api/download'
import type { PaymentSummary, ProgressSummary, Role, SubscriptionStatus, TrackProgress } from '../../../types'

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

/** Szerepkör-váltás (#162). A választ nem használjuk: a részletek újratöltése az egyetlen igazság. */
export async function changeRole(userId: number, role: Role): Promise<void> {
  await http.put(`/admin/users/${userId}/role`, { role })
}

export async function resendVerification(userId: number): Promise<void> {
  await http.post(`/admin/users/${userId}/verification-notification`)
}

export async function verifyEmail(userId: number, reason: string): Promise<void> {
  await http.post(`/admin/users/${userId}/verify-email`, { reason })
}

export async function revokeTokens(userId: number): Promise<void> {
  await http.delete(`/admin/users/${userId}/tokens`)
}

export async function sendPasswordReset(userId: number): Promise<void> {
  await http.post(`/admin/users/${userId}/password-reset`)
}

/** Egy felhasználó fizetése: a saját nézet mezői plusz a szolgáltatói azonosítók. */
export interface AdminPayment extends PaymentSummary {
  provider_payment_id: string | null
  provider_status: string | null
}

export interface AdminPaymentPage {
  data: AdminPayment[]
  meta: { current_page: number; last_page: number; total: number }
}

export const paymentsQuery = (userId: number, page: number) =>
  queryOptions({
    queryKey: [...adminUserKeys.detail(userId), 'payments', page] as const,
    queryFn: async ({ signal }) => (await http.get<AdminPaymentPage>(`/admin/users/${userId}/payments`, { params: { page }, signal })).data,
    placeholderData: keepPreviousData,
  })

/** A számla PDF-je (naplózott letöltés): Bearer token kell hozzá, ezért blobként kérjük le. */
export async function downloadInvoice(userId: number, paymentId: string, invoiceNumber: string): Promise<void> {
  const response = await http.get<Blob>(`/admin/users/${userId}/payments/${encodeURIComponent(paymentId)}/invoice`, { responseType: 'blob' })
  saveBlob(response.data, `szamla-${invoiceNumber}.pdf`)
}
