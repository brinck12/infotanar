import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

export type PanelKind = 'sheet' | 'work' | 'highlight' | 'note'

const KIND: Readonly<Record<PanelKind, string>> = {
  sheet: 'rounded-md border border-line bg-sheet',
  /** A fő munkafelület: csak a szerkesztőlap kap nagy sarkot és árnyékot. */
  work: 'rounded-lg border border-line bg-sheet shadow-sheet',
  highlight: 'rounded-lg border border-ink bg-sheet',
  note: 'rounded-md border border-note bg-note',
}

const PAD = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6', xl: 'p-8' } as const

interface PanelProps extends HTMLAttributes<HTMLElement> {
  kind?: PanelKind
  pad?: keyof typeof PAD
  as?: ElementType
  children: ReactNode
}

export function Panel({ kind = 'sheet', pad = 'lg', as: Tag = 'div', className, children, ...rest }: PanelProps) {
  return (
    <Tag className={cx(KIND[kind], PAD[pad], className)} {...rest}>
      {children}
    </Tag>
  )
}
