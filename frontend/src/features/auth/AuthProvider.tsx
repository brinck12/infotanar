import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { onSessionExpired } from '../../shared/api/client'
import { httpStatus } from '../../shared/api/errors'
import { tokenStore } from '../../shared/api/tokenStore'
import * as authApi from './api'
import { AuthContext, type AuthState } from './context'

const LOGIN_PATH = '/bejelentkezes'

/** Ennyi idő után egy ablakfókusz újra megkérdezi a szervert, él-e még a munkamenet. */
const SESSION_RECHECK_MS = 5 * 60_000

/**
 * A bejelentkezett felhasználó a React Query cache-ben él (`authKeys.me`),
 * így bármely komponens frissítheti vagy érvénytelenítheti.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [sessionExpired, setSessionExpired] = useState(false)

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
    // Máshol visszavont munkamenetet (pl. jelszócsere egy másik eszközön) így a
    // lapra visszatérve észrevesszük, nem csak a következő sikertelen kérésnél.
    staleTime: SESSION_RECHECK_MS,
    refetchOnWindowFocus: true,
  })

  /**
   * A néző személyétől függő adatok (zárolás, haladás) a belépéssel,
   * kilépéssel és e-mail-megerősítéssel elavulnak. A reset kiüríti és az
   * aktív nézetekben újratölti őket; a removeQueries-szel szemben nem
   * kapcsolja le a futó observereket.
   */
  const resetViewerData = useCallback(
    () => queryClient.resetQueries({ predicate: (query) => query.queryKey[0] !== authApi.authKeys.me[0] }),
    [queryClient],
  )

  /** A kliens állapota kijelentkezettre vált; a szerveroldali token sorsa a hívó dolga. */
  const forgetSession = useCallback(async () => {
    tokenStore.set(null)
    queryClient.setQueryData(authApi.authKeys.me, null)
    await resetViewerData()
  }, [queryClient, resetViewerData])

  // Munkamenet közben lejárt token (#136): kijelentkeztetünk, és a belépéshez
  // visszük a felhasználót; belépés után oda tér vissza, ahol volt (a
  // szerkesztő piszkozata a böngészőben megmarad).
  //
  // Az ok állapotban él, nem a navigáció state-jében: védett oldalon a
  // RequireAuth is átirányít, és az ő navigációja felülírná a miénket.
  useEffect(
    () =>
      onSessionExpired(() => {
        const from = window.location.pathname + window.location.search

        setSessionExpired(true)
        void forgetSession()
        navigate(LOGIN_PATH, { state: { from: from.startsWith(LOGIN_PATH) ? undefined : from } })
      }),
    [forgetSession, navigate],
  )

  const value = useMemo<AuthState>(
    () => ({
      user: user ?? null,
      loading: isLoading,
      sessionExpired,

      async login(email, password) {
        const { token, user: loggedIn } = await authApi.login(email, password)
        tokenStore.set(token)
        setSessionExpired(false)
        queryClient.setQueryData(authApi.authKeys.me, loggedIn)
        await resetViewerData()
        return loggedIn
      },

      async logout() {
        // A szerver hibája (pl. már lejárt token) sem tarthatja bejelentkezve a klienst.
        await authApi.logout().catch(() => undefined)
        await forgetSession()
      },

      async refresh() {
        await queryClient.invalidateQueries({ queryKey: authApi.authKeys.me })
        await resetViewerData()
      },
    }),
    [user, isLoading, sessionExpired, queryClient, resetViewerData, forgetSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
