import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context'
import { useMediaQuery } from '../shared/hooks/useMediaQuery'
import type { AuthUser } from '../types'

/** Ettől a szélességtől (Tailwind `md`) a menü egy sorban fér el; alatta lenyíló panel. */
const WIDE_LAYOUT = '(min-width: 768px)'

interface NavItem {
  to: string
  label: string
}

/** A tananyag az elsődleges belépő; a Feladatok a teljes, szűrhető gyakorlólista. */
const PUBLIC_ITEMS: NavItem[] = [
  { to: '/tananyag', label: 'Tananyag' },
  { to: '/feladatok', label: 'Feladatok' },
]

function itemsFor(user: AuthUser | null): NavItem[] {
  if (!user) return PUBLIC_ITEMS

  return [
    ...PUBLIC_ITEMS,
    { to: '/haladas', label: 'Haladásom' },
    { to: '/elofizetes', label: 'Előfizetés' },
    ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ]
}

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400'

/** Az aktív oldal linkje kiemelt; a NavLink az `aria-current`-et is beállítja. */
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-sm text-sm transition hover:text-slate-100 ${focusRing} ${isActive ? 'text-slate-100' : 'text-slate-400'}`

/**
 * Az oldal fejléce (#141). Széles kijelzőn a menü egy sorban van; keskenyen a
 * menügomb egy panelt nyit, hogy 320 px-en se legyen vízszintes görgetés.
 * Egyszerre csak az egyik változat van a DOM-ban.
 */
export function Header() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const wide = useMediaQuery(WIDE_LAYOUT)

  const items = itemsFor(user)
  const signOut = () => void logout().then(() => navigate('/'))

  return (
    <header className="relative border-b border-slate-800 bg-slate-900">
      <nav aria-label="Fő navigáció" className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link to="/" className={`rounded-sm font-semibold text-slate-100 ${focusRing}`}>
          InfoTanár
        </Link>

        {/* Amíg nem tudjuk, be van-e jelentkezve, a fiókhoz kötött elemek nem villannak fel. */}
        {loading ? null : wide ? (
          <WideMenu items={items} user={user} onSignOut={signOut} />
        ) : (
          <NarrowMenu items={items} user={user} onSignOut={signOut} />
        )}
      </nav>
    </header>
  )
}

interface MenuProps {
  items: NavItem[]
  user: AuthUser | null
  onSignOut: () => void
}

function WideMenu({ items, user, onSignOut }: MenuProps) {
  return (
    <>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={linkClass}>
          {item.label}
        </NavLink>
      ))}
      <div className="ml-auto flex min-w-0 items-center gap-4">
        {user ? (
          <>
            <NavLink to="/fiok" className={(state) => `max-w-48 truncate ${linkClass(state)}`} data-testid="account-name">
              {user.name}
            </NavLink>
            <button type="button" onClick={onSignOut} className={linkClass({ isActive: false })}>
              Kijelentkezés
            </button>
          </>
        ) : (
          <>
            <NavLink to="/bejelentkezes" className={linkClass}>
              Bejelentkezés
            </NavLink>
            <RegisterLink />
          </>
        )}
      </div>
    </>
  )
}

/**
 * Keskeny kijelző: a menügomb alatt lenyíló panel. Oldalváltáskor, Esc-re és
 * mellékattintásra bezárul; nyitáskor a fókusz a panelbe lép, Esc után vissza a gombra.
 */
function NarrowMenu({ items, user, onSignOut }: MenuProps) {
  const { pathname } = useLocation()
  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // A nyitott állapot ahhoz az oldalhoz kötött, ahol megnyitották: oldalváltáskor
  // magától zártnak számít, nem kell hozzá külön effekt.
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  const open = openedOn === pathname
  const close = () => setOpenedOn(null)

  useEffect(() => {
    if (!open) return

    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus()

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpenedOn(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      setOpenedOn(null)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const rowClass = (state: { isActive: boolean }) => `block py-3 ${linkClass(state)}`

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpenedOn(open ? null : pathname)}
        className={`ml-auto inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800 ${focusRing}`}
      >
        <span className="sr-only">Menü</span>
        <MenuIcon open={open} />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className="absolute inset-x-0 top-full z-30 border-b border-slate-800 bg-slate-900 px-4 pb-3 shadow-lg"
        >
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={rowClass} onClick={close}>
              {item.label}
            </NavLink>
          ))}
          <div className="mt-2 border-t border-slate-800 pt-2">
            {user ? (
              <>
                <NavLink to="/fiok" className={(state) => `truncate ${rowClass(state)}`} onClick={close} data-testid="account-name">
                  {user.name}
                </NavLink>
                <button type="button" onClick={onSignOut} className={`w-full text-left ${rowClass({ isActive: false })}`}>
                  Kijelentkezés
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-4 py-2">
                <NavLink to="/bejelentkezes" className={linkClass} onClick={close}>
                  Bejelentkezés
                </NavLink>
                <RegisterLink onClick={close} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function RegisterLink({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/regisztracio"
      onClick={onClick}
      className={`rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600 ${focusRing}`}
    >
      Regisztráció
    </Link>
  )
}

/** Három vonal, nyitva X; díszítő ikon, a gomb neve a „Menü" szöveg. */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  )
}
