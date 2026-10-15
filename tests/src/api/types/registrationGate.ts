/**
 * A zart beta regisztracios kapu valaszai (LAUNCH-2): mod, meghivokodok, varolista.
 * A frontend features/admin/registration/api.ts tipusainak tukre.
 */

export type RegistrationMode = 'open' | 'invite'

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

export interface InviteCodeInput {
  label: string
  max_uses?: number | null
  expires_at?: string | null
  code?: string | null
}

/** Laravel lapozo (a `through` utan: a `data` tomb mellett `total`, `current_page`). */
export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
