import type { ReactNode } from 'react'
import { hibaUzenet } from '../api/errors'
import { Banner } from './Banner'
import { Button } from './Button'
import { cx } from './cx'

/** Betöltés közbeni váz: a tartalom helyén halvány sávok. */
export function Skeleton({ lines = 3, label = 'Betöltés…', className }: { lines?: number; label?: string; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={cx('flex flex-col gap-3', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className={cx('h-4 rounded-sm bg-chip', index === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </div>
  )
}

/** Kártyarács váza a listaoldalakhoz. */
export function CardSkeleton({ count = 3, label = 'Betöltés…' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-md border border-line bg-sheet p-6">
          <span className="h-5 w-3/4 rounded-sm bg-chip" />
          <span className="h-4 w-1/2 rounded-sm bg-chip" />
          <span className="h-4 w-2/5 rounded-sm bg-chip" />
        </div>
      ))}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  children?: ReactNode
  /** Egyetlen művelet: az üres állapot cselekvésre hív. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, children, action, className }: EmptyStateProps) {
  return (
    <div className={cx('rounded-md border-2 border-dashed border-muted bg-sheet px-6 py-8 text-center', className)}>
      <p className="font-serif text-20 font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-prose text-16 leading-relaxed text-ink-soft">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

/** Lekérdezés hibája: mi történt, és egy gomb az újrapróbáláshoz. */
export function LoadError({ error, onRetry, title = 'Nem sikerült betölteni' }: { error: unknown; onRetry?: () => void; title?: string }) {
  return (
    <Banner
      kind="error"
      title={title}
      action={
        onRetry && (
          <Button variant="secondary" icon="refresh" onClick={onRetry}>
            Újrapróbálom
          </Button>
        )
      }
    >
      {hibaUzenet(error)}
    </Banner>
  )
}
