import { createContext, useContext } from 'react'
import type { AuthUser, LoginResponse } from '../../types'

export interface AuthState {
  user: AuthUser | null
  /** Amíg a tárolt tokent ellenőrizzük, nem tudjuk, be van-e jelentkezve. */
  loading: boolean
  /** Igaz, ha a munkamenet menet közben járt le (#136); a következő sikeres belépésig. */
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  /** A szervertől már megkapott tokent veszi át (közösségi belépés után). */
  acceptLogin: (response: LoginResponse) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth csak AuthProvideren belül használható')
  return ctx
}
