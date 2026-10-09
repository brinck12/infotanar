import type { ElementType, ReactNode } from 'react'
import { cx } from './cx'

interface TextProps {
  children: ReactNode
  className?: string
  id?: string
}

/** Oldalcím (h1): Literata, a nagy oldalakon 44, szűk helyen 36 px. */
export function PageTitle({ children, className, id, size = 'page' }: TextProps & { size?: 'page' | 'compact' }) {
  return (
    <h1
      id={id}
      className={cx(
        'font-serif leading-tight font-semibold tracking-tight',
        size === 'page' ? 'text-36 md:text-44' : 'text-28 md:text-36',
        className,
      )}
    >
      {children}
    </h1>
  )
}

export function SectionTitle({ children, className, id, as: Tag = 'h2' }: TextProps & { as?: ElementType }) {
  return (
    <Tag id={id} className={cx('font-serif text-28 leading-snug font-semibold tracking-tight', className)}>
      {children}
    </Tag>
  )
}

export function CardTitle({ children, className, id, as: Tag = 'h3' }: TextProps & { as?: ElementType }) {
  return (
    <Tag id={id} className={cx('font-serif text-20 leading-snug font-semibold', className)}>
      {children}
    </Tag>
  )
}

/** Bevezető bekezdés a cím alatt. */
export function Lead({ children, className }: TextProps) {
  return <p className={cx('text-19 leading-relaxed text-ink-soft', className)}>{children}</p>
}

/** Kódrészlet a folyó szövegben. */
export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="rounded-sm bg-headrow px-1.5 py-px text-inline">{children}</code>
}
