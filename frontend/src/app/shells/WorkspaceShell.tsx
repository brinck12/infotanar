import { useState, type ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/context'
import { Badge } from '../../shared/ui/Badge'
import { Breadcrumb, type Crumb } from '../../shared/ui/Breadcrumb'
import { Logo } from '../../shared/ui/Logo'
import { CrumbsContext } from '../../shared/ui/shell'
import { AccountNotices } from './AccountNotices'
import { Avatar } from './Avatar'

/** Tömör fehér fejléc: logó, morzsamenü, fiók. A feladat- és az admin oldalak közös teteje. */
export function CompactHeader({ crumbs, badge }: { crumbs: ReadonlyArray<Crumb>; badge?: ReactNode }) {
  const { user } = useAuth()

  return (
    <header className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-sheet px-4 py-2.5 md:px-6">
      <Logo compact />
      <div className="min-w-0 flex-1 basis-72">{crumbs.length > 0 && <Breadcrumb items={crumbs} />}</div>
      <div className="flex items-center gap-3">
        {badge}
        {user ? (
          <Link to="/fiok" aria-label="Fiókom" className="inline-flex min-h-11 items-center py-0">
            <Avatar name={user.name} small />
          </Link>
        ) : (
          <Link to="/bejelentkezes" className="inline-flex min-h-11 items-center text-15 font-semibold text-ink">
            Belépés
          </Link>
        )}
      </div>
    </header>
  )
}

/** A feladatoldalak kerete: teljes szélességű munkaterület a tömör fejléc alatt. */
export function WorkspaceShell() {
  const [crumbs, setCrumbs] = useState<ReadonlyArray<Crumb>>([])

  return (
    <CrumbsContext.Provider value={setCrumbs}>
      <CompactHeader crumbs={crumbs} />
      <AccountNotices />
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </CrumbsContext.Provider>
  )
}

/** Admin keret: a tömör fejléc Admin jelvénnyel, bal oldali menü és a tartalom. */
export function AdminBadge() {
  return <Badge kind="admin">Admin</Badge>
}
