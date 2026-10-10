import { cx } from './cx'

/** Haladáskockák: a kész kocka zöld, a többi körvonalas. Mindig számmal együtt használd. */
export function Tiles({ done, total, className }: { done: number; total: number; className?: string }) {
  if (total <= 0) return null

  return (
    <span role="img" aria-label={`${done} / ${total} kész`} className={cx('flex gap-0.75', className)}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cx('h-2.5 max-w-6 min-w-1 flex-1 rounded-sm', index < done ? 'bg-accent' : 'border border-muted bg-sheet')}
        />
      ))}
    </span>
  )
}

/** Folyamatsáv; a `label` a képernyőolvasónak szól (pl. „62 százalék”). */
export function Bar({ value, max = 100, label, className }: { value: number; max?: number; label: string; className?: string }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div role="img" aria-label={label} className={cx('h-2.5 overflow-hidden rounded-full bg-chip', className)}>
      <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
    </div>
  )
}

/** Nehézség: öt kis kocka és a szám mellette. */
export function Difficulty({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex items-center gap-2.5 text-14 text-ink-soft">
      <span>Nehézség</span>
      <span aria-hidden="true" className="inline-flex gap-0.75">
        {Array.from({ length: max }, (_, index) => (
          <span key={index} className={cx('size-2.5 rounded-sm', index < value ? 'bg-ink' : 'border border-muted')} />
        ))}
      </span>
      <span>
        {value} / {max}
      </span>
    </span>
  )
}
