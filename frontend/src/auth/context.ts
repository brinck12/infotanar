import { createContext, useContext } from 'react'
import type { AuthUser } from '../types'

export interface AuthState {
  user: AuthUser | null
  /** Amíg a tárolt tokent ellenőrizzük, nem tudjuk, be van-e jelentkezve. */
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth csak AuthProvideren belül használható')
  return ctx
}
