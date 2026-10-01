import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { hibaUzenet, mezoHibak } from '../../../../shared/api/errors'
import { Alert } from '../../../../shared/ui/Form'
import { PageLoader } from '../../../../shared/ui/PageLoader'

/** Betöltés / hiba / adat egységes kezelése az admin oldalakon. */
export function QueryState<T>({ query, children }: { query: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  if (query.isPending) return <PageLoader />
  if (query.isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Alert kind="error">{hibaUzenet(query.error)}</Alert>
      </div>
    )
  }
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

  if (Object.keys(fieldErrors).length === 0) return <Alert kind="error">{hibaUzenet(error)}</Alert>
  if (unshown.length === 0) return null
  return <Alert kind="error">{unshown.join(' ')}</Alert>
}
