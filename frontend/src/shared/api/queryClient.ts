import { QueryClient } from '@tanstack/react-query'
import { httpStatus } from './errors'

/** A 4xx válaszok determinisztikusak, újrapróbálni csak hálózati és 5xx hibát érdemes. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = httpStatus(error)
  if (status !== undefined && status < 500) return false
  return failureCount < 1
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: shouldRetry,
        retryDelay: 500,
        // A szerkesztőből kattintva vissza ne töltődjön újra a feladat.
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
