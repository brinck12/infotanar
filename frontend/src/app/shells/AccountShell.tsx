import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context'
import { PageTitle } from '../../shared/ui/Text'
import { SideMenu, SideMenuButton, type SideMenuItem } from './SideMenu'

const MENU: ReadonlyArray<SideMenuItem> = [
  { to: '/fiok', label: 'Profil', icon: 'user', end: true },
  { to: '/fiok/elofizetes', label: 'Előfizetés', icon: 'star' },
  { to: '/fiok/fizetesek', label: 'Fizetések és számlák', icon: 'file' },
  { to: '/fiok/szamlazasi-adatok', label: 'Számlázási adatok', icon: 'card' },
]

/** A fiók oldalai: bal oldali menü és a tartalom, a SiteShell-en belül. */
export function AccountShell() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <PageTitle>Fiókom</PageTitle>
      <div className="mt-7 flex flex-wrap items-start gap-8">
        <SideMenu
          label="Fiók menü"
          items={MENU}
          footer={
            <SideMenuButton icon="logout" onClick={() => void logout().then(() => navigate('/'))}>
              Kilépés
            </SideMenuButton>
          }
        />
        <div className="min-w-0 flex-1 basis-96">
          <Outlet />
        </div>
      </div>
    </main>
  )
}
