import { Button } from './Button'

interface PagerProps {
  page: number
  lastPage: number
  onChange: (page: number) => void
  /** A két irány felirata; alapból Előző / Következő. */
  previousLabel?: string
  nextLabel?: string
}

/** Lapozó a táblázatok és listák alatt; egyetlen oldalnál nem jelenik meg. */
export function Pager({ page, lastPage, onChange, previousLabel = 'Előző', nextLabel = 'Következő' }: PagerProps) {
  if (lastPage <= 1) return null

  return (
    <nav aria-label="Lapozás" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <Button variant="secondary" icon="chevron-left" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {previousLabel}
      </Button>
      <span className="text-15 text-ink-soft">
        {page}. oldal, összesen {lastPage}
      </span>
      <Button variant="secondary" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
        {nextLabel}
      </Button>
    </nav>
  )
}
