import { Link } from 'react-router-dom'
import { cx } from './cx'

const CELLS = [0, 10.5, 21] as const

/** 3×3 kocka, a középső zöld: a kockás füzet jele. */
export function LogoMark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={cx('flex-none', className)}>
      {CELLS.flatMap((y) =>
        CELLS.map((x) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="7"
            height="7"
            rx="1.5"
            className={x === 10.5 && y === 10.5 ? 'fill-accent' : 'fill-ink'}
          />
        )),
      )}
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="InfoTanár kezdőlap"
      className={cx('flex min-h-11 items-center py-0 text-ink no-underline hover:text-ink', compact ? 'gap-2.5' : 'gap-3')}
    >
      <LogoMark className={compact ? 'size-6' : 'size-7'} />
      <span className={cx('font-serif font-logo tracking-tight', compact ? 'text-19' : 'text-22')}>InfoTanár</span>
    </Link>
  )
}
