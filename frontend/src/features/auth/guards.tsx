import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Role } from '../../types'
import { PageLoader } from '../../shared/ui/PageLoader'
import { Forbidden } from '../system/NotFound'
import { useAuth } from './context'

/** Bejelentkezés nélkül a login oldalra visz, onnan sikeres belépés után vissza. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/bejelentkezes" replace state={{ from: location.pathname + location.search }} />

  return children
}

export function RequireRole({ allow, children }: { allow: Role; children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/bejelentkezes" replace />
  if (user.role !== allow) return <Forbidden />

  return children
}

/**
 * A login oldalt bejelentkezve nincs értelme mutatni. Sikeres belépés után
 * is ez visz tovább: oda, ahonnan a RequireAuth ide küldött.
 */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const from = (useLocation().state as { from?: string } | null)?.from

  if (loading) return <PageLoader />
  if (user) return <Navigate to={from ?? '/feladatok'} replace />

  return children
}
