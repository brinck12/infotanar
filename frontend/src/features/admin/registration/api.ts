import { http, type Envelope } from '../../../shared/api/client'

export type RegistrationMode = 'open' | 'invite'

/** A meghívókód állapota (backend InviteCode::state): aktív, letiltott, lejárt vagy elfogyott. */
export type InviteCodeState = 'active' | 'disabled' | 'expired' | 'used_up'

export interface InviteCode {
  id: number
  code: string
  label: string
  max_uses: number | null
  uses: number
  state: InviteCodeState
  expires_at: string | null
  disabled_at: string | null
  created_at: string | null
  created_by?: { id: number; name: string } | null
}

export interface WaitlistEntry {
  id: number
  email: string
  note: string | null
  created_at: string | null
}

export interface Page<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

export interface InviteCodePayload {
  label: string
  max_uses: number | null
  expires_at: string | null
  code: string | null
}

export const registrationKeys = {
  all: ['admin', 'registration'] as const,
  mode: () => [...registrationKeys.all, 'mode'] as const,
  codes: (page: number) => [...registrationKeys.all, 'codes', page] as const,
  codesAll: () => [...registrationKeys.all, 'codes'] as const,
  waitlist: (page: number) => [...registrationKeys.all, 'waitlist', page] as const,
}

export async function registrationMode(signal?: AbortSignal): Promise<RegistrationMode> {
  return (await http.get<Envelope<{ mode: RegistrationMode }>>('/admin/registration', { signal })).data.data.mode
}

export async function setRegistrationMode(mode: RegistrationMode): Promise<RegistrationMode> {
  return (await http.put<Envelope<{ mode: RegistrationMode }>>('/admin/registration', { mode })).data.data.mode
}

export async function inviteCodes(page: number, signal?: AbortSignal): Promise<Page<InviteCode>> {
  return (await http.get<Page<InviteCode>>('/admin/invite-codes', { params: { page }, signal })).data
}

export async function createInviteCode(payload: InviteCodePayload): Promise<InviteCode> {
  return (await http.post<Envelope<InviteCode>>('/admin/invite-codes', payload)).data.data
}

export async function disableInviteCode(id: number): Promise<InviteCode> {
  return (await http.post<Envelope<InviteCode>>(`/admin/invite-codes/${id}/disable`)).data.data
}

export async function waitlist(page: number, signal?: AbortSignal): Promise<Page<WaitlistEntry>> {
  return (await http.get<Page<WaitlistEntry>>('/admin/waitlist', { params: { page }, signal })).data
}

/** A meghívó linkje: a regisztrációs oldal előtöltött kóddal. */
export function inviteLink(code: string): string {
  return `${window.location.origin}/regisztracio?kod=${encodeURIComponent(code)}`
}
