import { useEffect, useRef, type KeyboardEvent } from 'react'
import { cx } from './cx'

/** Cellán belüli szerkesztés; ha nincs megadva, a rács csak olvasható és kijelölhető. */
export interface SheetGridEditor {
  /** Igaz, ha a kijelölt cella szerkesztés alatt áll. */
  active: boolean
  value: string
  /** Szerkesztés indítása; `initial` a leütött karakter (az felülírja a tartalmat), nélküle a meglévő tartalom marad. */
  onStart: (initial?: string) => void
  onChange: (value: string) => void
  /** Enter: lefelé, Tab: jobbra lép; a fókuszvesztés helyben marad. */
  onCommit: (move: 'down' | 'right' | 'none') => void
  onCancel: () => void
}

interface SheetGridProps {
  columns: number
  rows: number
  /** A megjelenítendő érték cellacím szerint (pl. `B2`). */
  valueOf: (cell: string) => string
  selected: string
  onSelect: (cell: string) => void
  /** A tábla neve a képernyőolvasónak. */
  label: string
  editor?: SheetGridEditor
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const HEAD = 'border border-line bg-headrow px-2 py-1.5 text-13 font-semibold text-ink-soft'

const isNumeric = (value: string) => /^-?\d+(,\d+)?$/.test(value)

/**
 * Táblázatrács oszlopbetűkkel és sorszámokkal. A kijelölt cella zöld keretet
 * kap; a rács nyilakkal bejárható. Szerkesztő megadásakor a cellába közvetlenül
 * lehet írni: leütésre, F2-re, Enterre vagy dupla kattintásra nyílik a beviteli mező.
 */
export function SheetGrid({ columns, rows, valueOf, selected, onSelect, label, editor }: SheetGridProps) {
  const tableRef = useRef<HTMLTableElement>(null)
  const editing = editor?.active ?? false
  const wasEditing = useRef(false)

  // A szerkesztés végén a fókusz visszakerül a (kijelölt) cellára, hogy a billentyűzetes munka folytatódjon.
  useEffect(() => {
    if (wasEditing.current && !editing) tableRef.current?.querySelector<HTMLElement>(`[data-cell="${selected}"]`)?.focus()
    wasEditing.current = editing
  }, [editing, selected])

  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    if (event.target instanceof HTMLInputElement) return
    if (editor && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (event.key === 'Enter' || event.key === 'F2') {
        event.preventDefault()
        editor.onStart()
        return
      }
      if (event.key.length === 1) {
        event.preventDefault()
        editor.onStart(event.key)
        return
      }
    }
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
      <table ref={tableRef} aria-label={label} className="w-full border-collapse" onKeyDown={onKeyDown}>
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
                if (editor && editing && isSelected) {
                  return (
                    <td key={cell} className="border border-grid p-0">
                      <input
                        // oxlint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        aria-label={`${cell} szerkesztése`}
                        value={editor.value}
                        spellCheck={false}
                        autoComplete="off"
                        onChange={(event) => editor.onChange(event.target.value)}
                        onBlur={() => editor.onCommit('none')}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            editor.onCommit('down')
                          } else if (event.key === 'Tab') {
                            event.preventDefault()
                            editor.onCommit('right')
                          } else if (event.key === 'Escape') {
                            event.preventDefault()
                            editor.onCancel()
                          }
                        }}
                        className="block min-h-8 w-full bg-sheet px-2 py-1 font-mono text-14 outline-2 -outline-offset-2 outline-accent"
                      />
                    </td>
                  )
                }
                return (
                  <td key={cell} className="border border-grid p-0">
                    <button
                      type="button"
                      data-cell={cell}
                      aria-label={`${cell}: ${value === '' ? 'üres' : value}`}
                      aria-pressed={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => onSelect(cell)}
                      onDoubleClick={editor ? () => editor.onStart() : undefined}
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
