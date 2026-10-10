import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { hibaUzenet, mezoHibak } from '../../../../shared/api/errors'
import { Banner } from '../../../../shared/ui/Banner'
import { LoadError, Skeleton } from '../../../../shared/ui/States'

/** Betöltés / hiba / adat egységes kezelése az admin oldalakon. */
export function QueryState<T>({ query, children }: { query: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  if (query.isPending) return <Skeleton lines={5} className="max-w-prose" />
  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />
  return children(query.data)
}

const NO_FIELDS: readonly string[] = []

/**
 * Egy mutáció hibája. A 422-es mezőhibák a mezők alatt jelennek meg; ami
 * olyan kulcsra jön, amelyet ez az űrlap nem jelenít meg (pl. egy kapcsolódó
 * erőforrás szabálya), vagy nem mezőhiba, az itt, hogy semmi ne vesszen el.
 */
export function MutationError({ error, fields = NO_FIELDS }: { error: unknown; fields?: readonly string[] }) {
  if (!error) return null
  const fieldErrors = mezoHibak(error)
  const unshown = Object.entries(fieldErrors)
    .filter(([key]) => !fields.includes(key))
    .map(([, message]) => message)

  if (Object.keys(fieldErrors).length === 0) {
    return (
      <Banner kind="error" className="mb-4">
        {hibaUzenet(error)}
      </Banner>
    )
  }
  if (unshown.length === 0) return null
  return (
    <Banner kind="error" className="mb-4">
      {unshown.join(' ')}
    </Banner>
  )
}
