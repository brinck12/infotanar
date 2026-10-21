import { useQuery } from '@tanstack/react-query'
import * as authApi from './api'

/**
 * Mely közösségi belépések érhetők el. Ha a lekérés nem sikerül, nincs gomb:
 * az e-mailes belépés enélkül is teljes értékű.
 */
export function useAuthProviders(): { google: boolean } {
  const query = useQuery({
    queryKey: authApi.authKeys.providers,
    queryFn: ({ signal }) => authApi.authProviders(signal),
    staleTime: 60_000,
    retry: false,
  })

  return { google: query.data?.google ?? false }
}
