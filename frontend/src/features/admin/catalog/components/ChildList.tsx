import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface ChildItem {
  id: number
  title: string
  to: string
  meta?: ReactNode
}

interface Props {
  items: ChildItem[]
  emptyText: string
  /** Az új, teljes sorrend (a backend a szülő összes gyerekét várja). */
  onReorder: (ids: number[]) => void
  onDelete: (id: number) => void
  busy: boolean
  /** A képernyőolvasó számára: pl. „modul”. */
  noun: string
}

/**
 * Egy szülő gyerekei sorrendben (#47): megnyitás, fel/le mozgatás és törlés
 * helyben megerősítve. A mozgatás gombokkal történik (billentyűzettel és
 * érintéssel is használható, szemben a drag and drop-pal).
 */
export function ChildList({ items, emptyText, onReorder, onDelete, busy, noun }: Props) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  if (items.length === 0) return <p className="text-sm text-slate-400">{emptyText}</p>

  function move(index: number, delta: -1 | 1) {
    const ids = items.map((item) => item.id)
    const target = index + delta
    const [moved] = ids.splice(index, 1)
    if (moved === undefined) return
    ids.splice(target, 0, moved)
    onReorder(ids)
  }

  return (
    <ol className="divide-y divide-slate-800 rounded-lg border border-slate-800" data-testid="admin-child-list">
      {items.map((item, index) => (
        <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
          <span className="w-6 text-right text-xs tabular-nums text-slate-500">{index + 1}.</span>
          <Link to={item.to} className="min-w-0 flex-1 truncate text-sm text-slate-100 hover:text-sky-300 hover:underline">
            {item.title}
          </Link>
          {item.meta && <span className="flex flex-wrap items-center gap-1.5">{item.meta}</span>}

          {confirmingId === item.id ? (
            <span role="group" aria-label={`${item.title} törlésének megerősítése`} className="flex items-center gap-2 text-xs">
              <span className="text-amber-200">Biztosan törlöd?</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setConfirmingId(null)
                  onDelete(item.id)
                }}
                className="rounded bg-red-800 px-2 py-1 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Törlés
              </button>
              <button type="button" onClick={() => setConfirmingId(null)} className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800">
                Mégse
              </button>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <IconButton label={`${item.title} (${noun}) feljebb`} disabled={busy || index === 0} onClick={() => move(index, -1)}>
                ↑
              </IconButton>
              <IconButton label={`${item.title} (${noun}) lejjebb`} disabled={busy || index === items.length - 1} onClick={() => move(index, 1)}>
                ↓
              </IconButton>
              <IconButton label={`${item.title} (${noun}) törlése`} disabled={busy} onClick={() => setConfirmingId(item.id)} danger>
                ✕
              </IconButton>
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  danger = false,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`h-7 w-7 rounded text-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? 'text-red-300 hover:bg-red-950' : 'text-slate-300 hover:bg-slate-800'
      }`}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  )
}
