import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cx } from '../../shared/ui/cx'
import { Icon, type IconName } from '../../shared/ui/Icon'

export interface SideMenuItem {
  to: string
  label: string
  icon: IconName
  /** Csak a pontos útvonalon aktív (pl. a szekció nyitóoldala). */
  end?: boolean
}

const ITEM = 'flex min-h-12 items-center gap-3 rounded-md px-3.5 py-0 text-16 font-semibold no-underline'

/** Bal oldali menü a fiók és az admin keretben; az aktív pont sötét kitöltést kap. */
export function SideMenu({ label, items, footer }: { label: string; items: ReadonlyArray<SideMenuItem>; footer?: ReactNode }) {
  return (
    <nav aria-label={label} className="flex w-full flex-col gap-1.5 md:w-60 md:flex-none">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => cx(ITEM, isActive ? 'bg-ink text-sheet hover:text-sheet' : 'text-ink hover:bg-note hover:text-ink')}
        >
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
      {footer}
    </nav>
  )
}

export function SideMenuButton({ icon, children, onClick }: { icon: IconName; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cx(ITEM, 'text-left text-ink hover:bg-note')}>
      <Icon name={icon} />
      {children}
    </button>
  )
}
