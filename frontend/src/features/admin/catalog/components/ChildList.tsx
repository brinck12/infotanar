import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../../shared/ui/Button'
import { cx } from '../../../../shared/ui/cx'
import { Icon, type IconName } from '../../../../shared/ui/Icon'
import { Modal } from '../../../../shared/ui/Modal'

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
 * megerősítéssel. A mozgatás gombokkal történik (billentyűzettel és
 * érintéssel is használható, szemben a drag and drop-pal).
 */
export function ChildList({ items, emptyText, onReorder, onDelete, busy, noun }: Props) {
  const [confirming, setConfirming] = useState<ChildItem | null>(null)

  if (items.length === 0) return <p className="text-15 text-ink-soft">{emptyText}</p>

  function move(index: number, delta: -1 | 1) {
    const ids = items.map((item) => item.id)
    const target = index + delta
    const [moved] = ids.splice(index, 1)
    if (moved === undefined) return
    ids.splice(target, 0, moved)
    onReorder(ids)
  }

  return (
    <>
      <ol data-testid="admin-child-list">
        {items.map((item, index) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grid py-1.5">
            <span className="w-6 text-right text-14 text-ink-soft tabular-nums">{index + 1}.</span>
            <Link to={item.to} className="inline-flex min-h-11 min-w-0 flex-1 basis-56 items-center text-16 font-medium text-ink">
              {item.title}
            </Link>
            {item.meta && <span className="flex flex-wrap items-center gap-1.5">{item.meta}</span>}
            <span className="flex items-center gap-1">
              <IconButton icon="chevron-up" label={`${item.title} (${noun}) feljebb`} disabled={busy || index === 0} onClick={() => move(index, -1)} />
              <IconButton
                icon="chevron-down"
                label={`${item.title} (${noun}) lejjebb`}
                disabled={busy || index === items.length - 1}
                onClick={() => move(index, 1)}
              />
              <IconButton icon="trash" label={`${item.title} (${noun}) törlése`} disabled={busy} onClick={() => setConfirming(item)} danger />
            </span>
          </li>
        ))}
      </ol>

      <Modal
        open={confirming !== null}
        title={`Biztosan törlöd ezt: ${noun}?`}
        onClose={() => setConfirming(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirming(null)}>
              Mégsem
            </Button>
            <Button
              variant="danger"
              icon="trash"
              disabled={busy}
              onClick={() => {
                if (confirming) onDelete(confirming.id)
                setConfirming(null)
              }}
            >
              Törlés
            </Button>
          </>
        }
      >
        <p>
          <strong>{confirming?.title}</strong> és minden, ami alá tartozik, véglegesen törlődik. Ezt nem lehet visszavonni.
        </p>
      </Modal>
    </>
  )
}

interface IconButtonProps {
  icon: IconName
  label: string
  disabled: boolean
  onClick: () => void
  danger?: boolean
}

export function IconButton({ icon, label, disabled, onClick, danger = false }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex size-11 items-center justify-center rounded-md disabled:text-muted',
        danger ? 'text-wrong hover:bg-wrong-soft' : 'text-ink hover:bg-note',
        'disabled:hover:bg-transparent',
      )}
    >
      <Icon name={icon} />
    </button>
  )
}
