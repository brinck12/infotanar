import { createContext, useContext, useEffect } from 'react'
import type { Crumb } from './Breadcrumb'

/**
 * A munkaterület- és az admin keret fejléce morzsamenüt mutat, de azt az
 * oldal tudja, hol jár. Az oldal a `useCrumbs`-szal adja át a keretnek.
 */
export const CrumbsContext = createContext<((crumbs: ReadonlyArray<Crumb>) => void) | null>(null)

export function useCrumbs(crumbs: ReadonlyArray<Crumb>): void {
  const setCrumbs = useContext(CrumbsContext)
  const key = JSON.stringify(crumbs)

  useEffect(() => {
    setCrumbs?.(JSON.parse(key) as Crumb[])
  }, [setCrumbs, key])
}
