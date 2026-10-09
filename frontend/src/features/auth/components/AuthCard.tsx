import type { ReactNode } from 'react'
import { cx } from '../../../shared/ui/cx'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { Panel } from '../../../shared/ui/Panel'

interface AuthCardProps {
  title: string
  /** Rövid bevezető a cím alatt. */
  lead?: ReactNode
  /** Kerek jel a cím fölött (pl. boríték a megerősítő levélnél). */
  icon?: IconName
  iconTone?: 'accent' | 'neutral'
  children: ReactNode
  /** A kártya alján, vonallal elválasztva (pl. „Még nincs fiókod?”). */
  footer?: ReactNode
}

/** Az AuthShell egyetlen kártyája. */
export function AuthCard({ title, lead, icon, iconTone = 'accent', children, footer }: AuthCardProps) {
  return (
    <Panel kind="sheet" pad="xl" className="rounded-lg">
      {icon && (
        <span
          className={cx(
            'mb-4 inline-flex size-14 items-center justify-center rounded-full',
            iconTone === 'accent' ? 'bg-accent-soft text-accent' : 'bg-note text-ink',
          )}
        >
          <Icon name={icon} size={28} />
        </span>
      )}
      <h1 className="font-serif text-32 leading-tight font-semibold tracking-tight">{title}</h1>
      {lead && <p className="mt-2.5 text-16 leading-relaxed text-ink-soft">{lead}</p>}
      <div className="mt-6 flex flex-col gap-5">{children}</div>
      {footer && <div className="mt-6 border-t border-grid pt-5 text-15 leading-relaxed text-ink-soft">{footer}</div>}
    </Panel>
  )
}
