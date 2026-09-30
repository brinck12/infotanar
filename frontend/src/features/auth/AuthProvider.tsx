import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import { httpStatus } from '../../shared/api/errors'
import { tokenStore } from '../../shared/api/tokenStore'
import * as authApi from './api'
import { AuthContext, type AuthState } from './context'

/**
 * A bejelentkezett felhasználó a React Query cache-ben él (`authKeys.me`),
 * így bármely komponens frissítheti vagy érvénytelenítheti.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: authApi.authKeys.me,
    queryFn: async ({ signal }) => {
      if (!tokenStore.get()) return null
      try {
        return await authApi.me(signal)
      } catch (error) {
        // Lejárt vagy visszavont token: kijelentkeztetjük. Hálózati hibánál megtartjuk.
        if (httpStatus(error) === 401) {
          tokenStore.set(null)
          return null
        }
        throw error
      }
    },
    staleTime: Infinity,
  })

  const value = useMemo<AuthState>(() => {
    /**
     * A néző személyétől függő adatok (zárolás, haladás) a belépéssel,
     * kilépéssel és e-mail-megerősítéssel elavulnak. A reset kiüríti és az
     * aktív nézetekben újratölti őket; a removeQueries-szel szemben nem
     * kapcsolja le a futó observereket.
     */
    const resetViewerData = () =>
      queryClient.resetQueries({ predicate: (query) => query.queryKey[0] !== authApi.authKeys.me[0] })

    return {
      user: user ?? null,
      loading: isLoading,

      async login(email, password) {
        const { token, user: loggedIn } = await authApi.login(email, password)
        tokenStore.set(token)
        queryClient.setQueryData(authApi.authKeys.me, loggedIn)
        await resetViewerData()
        return loggedIn
      },

      async logout() {
        try {
          await authApi.logout()
        } finally {
          tokenStore.set(null)
          queryClient.setQueryData(authApi.authKeys.me, null)
          await resetViewerData()
        }
      },

      async refresh() {
        await queryClient.invalidateQueries({ queryKey: authApi.authKeys.me })
        await resetViewerData()
      },
    }
  }, [user, isLoading, queryClient])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
