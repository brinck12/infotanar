import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context'
import { ButtonLink } from '../../shared/ui/Button'
import { cx } from '../../shared/ui/cx'
import { Icon } from '../../shared/ui/Icon'
import { Logo } from '../../shared/ui/Logo'
import { AccountNotices } from './AccountNotices'
import { Avatar } from './Avatar'
import { SiteFooter } from './SiteFooter'

const NAV = [
  { to: '/tanulasi-ut', label: 'Tanulási út' },
  { to: '/feladatok', label: 'Feladatok' },
  { to: '/vizsgak', label: 'Gyakorló vizsgák' },
  { to: '/szobeli', label: 'Szóbeli' },
  { to: '/haladas', label: 'Haladásom' },
  { to: '/arak', label: 'Árak' },
] as const

/** A nyilvános és a tanulói oldalak kerete: fejléc a főmenüvel, tartalom, lábléc. */
export function SiteShell() {
  const { user, loading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  // A mobil menü ahhoz az útvonalhoz kötve nyitott, ahol megnyitották: navigáció után magától bezárul.
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null)
  const menuOpen = menuOpenAt === location.pathname

  return (
    <>
      <header className="mx-auto flex w-full max-w-page flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4 md:px-6">
        <div className="mr-auto">
          <Logo />
        </div>

        <nav aria-label="Főmenü" className="hidden flex-wrap items-center gap-x-7 gap-y-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'inline-flex min-h-11 items-center text-16 text-ink hover:text-ink',
                  isActive ? 'font-bold underline decoration-accent decoration-3 underline-offset-10' : 'font-medium no-underline',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!loading && !user && (
            <>
              <Link to="/bejelentkezes" className="hidden min-h-11 items-center px-1 text-16 font-semibold text-ink no-underline md:inline-flex">
                Belépés
              </Link>
              <ButtonLink to="/regisztracio" variant="secondary">
                Regisztráció
              </ButtonLink>
            </>
          )}
          {user && (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="hidden min-h-11 items-center text-15 font-semibold text-ink md:inline-flex">
                  Admin
                </Link>
              )}
              <Link to="/fiok" aria-label="Fiókom" className="inline-flex min-h-11 items-center gap-2.5 py-0 text-ink no-underline">
                <span className="hidden text-15 md:inline" data-testid="account-name">
                  {user.name}
                </span>
                <Avatar name={user.name} />
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label="Menü"
            aria-expanded={menuOpen}
            aria-controls="mobil-menu"
            onClick={() => setMenuOpenAt(menuOpen ? null : location.pathname)}
            className="inline-flex size-11 items-center justify-center rounded-md border border-ink bg-sheet text-ink md:hidden"
          >
            <Icon name={menuOpen ? 'x' : 'menu'} size={22} />
          </button>
        </div>

        {menuOpen && (
          <nav id="mobil-menu" aria-label="Főmenü" className="flex basis-full flex-col pt-2 pb-3 md:hidden">
            {NAV.map((item) => (
              <MobileLink key={item.to} to={item.to} label={item.label} />
            ))}
            {user ? (
              <>
                {user.role === 'admin' && <MobileLink to="/admin" label="Admin" />}
                <MobileLink to="/fiok" label="Fiókom" />
                <button
                  type="button"
                  onClick={() => void logout().then(() => navigate('/'))}
                  className="flex min-h-12 items-center border-t border-grid text-left text-18 font-medium text-ink"
                >
                  Kilépés
                </button>
              </>
            ) : (
              <MobileLink to="/bejelentkezes" label="Belépés" />
            )}
          </nav>
        )}
      </header>

      <AccountNotices />

      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>

      <SiteFooter />
    </>
  )
}

function MobileLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx('flex min-h-12 items-center border-t border-grid py-0 text-18 text-ink no-underline', isActive ? 'font-bold' : 'font-medium')
      }
    >
      {label}
    </NavLink>
  )
}
