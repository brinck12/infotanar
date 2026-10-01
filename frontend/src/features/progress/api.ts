import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../shared/api/client'
import type { ProgressReport, TrackDetail } from '../../types'

export const progressKeys = {
  all: ['progress'] as const,
  report: () => [...progressKeys.all, 'report'] as const,
  track: (slug: string) => ['catalog', 'track', slug] as const,
}

/** Felhasználónként változik: kijelentkezéskor az auth-váltás üríti a cache-t. */
export const progressQuery = () =>
  queryOptions({
    queryKey: progressKeys.report(),
    queryFn: async ({ signal }) => (await http.get<Envelope<ProgressReport>>('/progress', { signal })).data.data,
  })

/** A katalógus szerkezete ritkán változik; a leckecímekhez és a feladat-linkekhez kell. */
export const trackQuery = (slug: string) =>
  queryOptions({
    queryKey: progressKeys.track(slug),
    queryFn: async ({ signal }) => (await http.get<Envelope<TrackDetail>>(`/tracks/${encodeURIComponent(slug)}`, { signal })).data.data,
    staleTime: 5 * 60_000,
  })
