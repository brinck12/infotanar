import { Fragment } from 'react'
import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  /** Az utolsó elemnek nincs címe: az a jelenlegi oldal. */
  to?: string
}

export function Breadcrumb({ items }: { items: ReadonlyArray<Crumb> }) {
  return (
    <nav aria-label="Morzsamenü" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-15">
      {items.map((item, index) => (
        <Fragment key={`${item.to ?? ''}|${item.label}`}>
          {index > 0 && (
            <span aria-hidden="true" className="text-muted">
              /
            </span>
          )}
          {item.to && index < items.length - 1 ? (
            <Link to={item.to} className="inline-flex min-h-11 items-center text-ink-soft">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-semibold text-ink">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
