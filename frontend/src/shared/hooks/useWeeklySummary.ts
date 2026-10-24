import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '../../features/auth/api'
import { useAuth } from '../../features/auth/context'
import { LEGAL_VERSIONS } from '../../features/legal/documents'
import { updateWeeklySummary } from '../api/notifications'

/**
 * A heti összefoglaló e-mail beállítása a bejelentkezett felhasználónak. Csak megerősített
 * e-mail-címmel kapcsolható be. A `weekly_summary` mező hiányát (régebbi válasz) kikapcsoltnak vesszük.
 */
export function useWeeklySummary() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (enabled: boolean) => updateWeeklySummary(enabled, LEGAL_VERSIONS.privacy),
    onSuccess: (updated) => queryClient.setQueryData(authKeys.me, updated),
  })

  return {
    enabled: user?.weekly_summary === true,
    canEnable: Boolean(user?.email_verified_at),
    set: (enabled: boolean) => mutation.mutate(enabled),
    pending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
    reset: mutation.reset,
  }
}
