import type { KeyboardEvent } from 'react'
import { cx } from './cx'

interface SheetGridProps {
  columns: number
  rows: number
  /** A megjelenítendő érték cellacím szerint (pl. `B2`). */
  valueOf: (cell: string) => string
  selected: string
  onSelect: (cell: string) => void
  /** A tábla neve a képernyőolvasónak. */
  label: string
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const HEAD = 'border border-line bg-headrow px-2 py-1.5 text-13 font-semibold text-ink-soft'

const isNumeric = (value: string) => /^-?\d+(,\d+)?$/.test(value)

/**
 * Táblázatrács oszlopbetűkkel és sorszámokkal. A kijelölt cella zöld keretet
 * kap; a rács nyilakkal bejárható, a szerkesztés a képletsávban történik.
 */
export function SheetGrid({ columns, rows, valueOf, selected, onSelect, label }: SheetGridProps) {
  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const column = LETTERS.indexOf(selected.charAt(0))
    const row = Number(selected.slice(1)) - 1
    const step = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[event.key]
    if (!step) return
    const [dx = 0, dy = 0] = step
    const nextColumn = Math.min(columns - 1, Math.max(0, column + dx))
    const nextRow = Math.min(rows - 1, Math.max(0, row + dy))
    event.preventDefault()
    const next = `${LETTERS[nextColumn] ?? 'A'}${nextRow + 1}`
    onSelect(next)
    event.currentTarget.querySelector<HTMLElement>(`[data-cell="${next}"]`)?.focus()
  }

  return (
    <div className="overflow-auto rounded-sm border border-line bg-sheet">
      {/* A rács a nyilakkal bejárható: a táblázat maga kezeli a billentyűket. */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <table aria-label={label} className="w-full border-collapse" onKeyDown={onKeyDown}>
        <thead>
          <tr>
            <td className={cx(HEAD, 'w-10')}>
              <span className="sr-only">Sorszám</span>
            </td>
            {Array.from({ length: columns }, (_, column) => (
              <th key={column} scope="col" className={cx(HEAD, 'min-w-21')}>
                {LETTERS[column]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_row, row) => (
            <tr key={row}>
              <th scope="row" className={cx(HEAD, 'text-center')}>
                {row + 1}
              </th>
              {Array.from({ length: columns }, (_column, column) => {
                const cell = `${LETTERS[column] ?? 'A'}${row + 1}`
                const value = valueOf(cell)
                const isSelected = cell === selected
                return (
                  <td key={cell} className="border border-grid p-0">
                    <button
                      type="button"
                      data-cell={cell}
                      aria-label={`${cell}: ${value === '' ? 'üres' : value}`}
                      aria-pressed={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => onSelect(cell)}
                      className={cx(
                        'block min-h-8 w-full px-2 py-1 text-14 whitespace-nowrap',
                        isNumeric(value) ? 'text-right' : 'text-left',
                        row === 0 && 'font-bold',
                        value.startsWith('#') && 'text-wrong',
                        isSelected && 'outline-2 -outline-offset-2 outline-accent',
                      )}
                    >
                      {value}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
