import type { ReactNode } from 'react'
import { cx } from './cx'
import { Icon, type IconName } from './Icon'

export type BannerKind = 'info' | 'warn' | 'error' | 'success'

const KIND: Readonly<Record<BannerKind, { box: string; icon: IconName; iconClass: string }>> = {
  info: { box: 'border-transparent bg-note', icon: 'info', iconClass: 'text-ink' },
  warn: { box: 'border-ink bg-sheet', icon: 'warn', iconClass: 'text-ink' },
  error: { box: 'border-wrong bg-wrong-soft', icon: 'warn', iconClass: 'text-wrong' },
  success: { box: 'border-accent bg-accent-soft', icon: 'check', iconClass: 'text-accent' },
}

interface BannerProps {
  kind?: BannerKind
  title?: ReactNode
  children?: ReactNode
  /** Egyetlen művelet (gomb vagy hivatkozás) a szöveg alatt. */
  action?: ReactNode
  className?: string
  'data-testid'?: string
}

/** Üzenetsáv: tudnivaló, figyelem, hiba vagy siker. A hiba `role="alert"`. */
export function Banner({ kind = 'info', title, children, action, className, ...rest }: BannerProps) {
  const style = KIND[kind]

  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cx('flex items-start gap-3 rounded-md border-strong px-4.5 py-3.5 text-ink', style.box, className)}
      {...rest}
    >
      <Icon name={style.icon} size={22} className={cx('mt-px', style.iconClass)} />
      <div className="min-w-0 flex-1">
        {title && <p className="text-16 font-bold">{title}</p>}
        {children && <div className={cx('text-15 leading-relaxed', title ? 'mt-1' : '')}>{children}</div>}
        {action && <div className="mt-3 flex flex-wrap items-center gap-3">{action}</div>}
      </div>
    </div>
  )
}
