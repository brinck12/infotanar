import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cx } from './cx'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** Jobbra igazított műveletek: balra a másodlagos, jobbra az elsődleges (vagy a veszélyes). */
  actions?: ReactNode
  size?: 'md' | 'lg'
}

/**
 * Párbeszédablak a böngésző `<dialog>` elemével: a fókuszcsapdát, az Esc
 * billentyűt és a fókusz visszaadását a `showModal()` adja.
 */
export function Modal({ open, title, onClose, children, actions, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className={cx(
        'm-auto w-full rounded-lg bg-sheet p-0 text-ink shadow-modal backdrop:bg-backdrop',
        size === 'lg' ? 'max-w-account' : 'max-w-form',
      )}
    >
      {open && (
        <div className="p-6 md:p-8">
          <h2 id={titleId} className="font-serif text-24 leading-snug font-semibold">
            {title}
          </h2>
          <div className="mt-3 text-16 leading-relaxed">{children}</div>
          {actions && <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div>}
        </div>
      )}
    </dialog>
  )
}
