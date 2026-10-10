import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import type { Crumb } from '../../shared/ui/Breadcrumb'
import { CrumbsContext } from '../../shared/ui/shell'
import { SideMenu, type SideMenuItem } from './SideMenu'
import { AdminBadge, CompactHeader } from './WorkspaceShell'

const MENU: ReadonlyArray<SideMenuItem> = [
  { to: '/admin', label: 'Áttekintés', icon: 'home', end: true },
  { to: '/admin/tananyag', label: 'Katalógus', icon: 'book' },
  { to: '/admin/vizsgak', label: 'Gyakorló vizsgák', icon: 'flag' },
  { to: '/admin/felhasznalok', label: 'Felhasználók', icon: 'user' },
  { to: '/admin/szamlak', label: 'Számlák', icon: 'file' },
]

export function AdminShell() {
  const [crumbs, setCrumbs] = useState<ReadonlyArray<Crumb>>([{ label: 'Admin' }])

  return (
    <CrumbsContext.Provider value={setCrumbs}>
      <CompactHeader crumbs={crumbs} badge={<AdminBadge />} />
      <div className="mx-auto flex w-full max-w-work flex-1 flex-wrap items-start gap-8 px-4 py-6 md:px-6">
        <SideMenu label="Admin menü" items={MENU} />
        <main className="min-w-0 flex-1 basis-160">
          <Outlet />
        </main>
      </div>
    </CrumbsContext.Provider>
  )
}
