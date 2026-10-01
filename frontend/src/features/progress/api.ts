import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../shared/api/client'
import type { ProgressReport } from '../../types'

export const progressKeys = {
  all: ['progress'] as const,
  report: () => [...progressKeys.all, 'report'] as const,
}

/** Felhasználónként változik: kijelentkezéskor az auth-váltás üríti a cache-t. */
export const progressQuery = () =>
  queryOptions({
    queryKey: progressKeys.report(),
    queryFn: async ({ signal }) => (await http.get<Envelope<ProgressReport>>('/progress', { signal })).data.data,
  })
