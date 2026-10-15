import { useQuery } from '@tanstack/react-query'
import * as authApi from './api'

/**
 * A regisztráció módja. Ha a lekérés nem sikerül, nyitottnak vesszük: a szerver
 * úgyis elutasítja a kód nélküli kérést, így a hiba nem zárja ki a meghívottat.
 */
export function useRegistrationMode(): { mode: authApi.RegistrationMode; pending: boolean } {
  const query = useQuery({
    queryKey: authApi.authKeys.registration,
    queryFn: ({ signal }) => authApi.registrationMode(signal),
    staleTime: 60_000,
    retry: false,
  })

  return { mode: query.data ?? 'open', pending: query.isPending }
}
