import { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { tokenStore } from '../api/client'
import type { AuthUser } from '../types'
import { AuthContext } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(() => tokenStore.get() !== null)

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null)
      return
    }
    try {
      setUser(await authApi.me())
    } catch (error) {
      // Lejárt vagy visszavont token: kijelentkeztetjük. Hálózati hibánál megtartjuk.
      if (error instanceof AxiosError && error.response?.status === 401) {
        tokenStore.set(null)
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    if (!tokenStore.get()) return
    authApi
      .me()
      .then(setUser)
      .catch((error: unknown) => {
        if (error instanceof AxiosError && error.response?.status === 401) tokenStore.set(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedIn } = await authApi.login(email, password)
    tokenStore.set(token)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      tokenStore.set(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading, login, logout, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
