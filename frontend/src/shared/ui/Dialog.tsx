import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  /** Az Esc vagy a hívó zárja be; mindkettő ide fut be. Mellékattintásra szándékosan nem zárul. */
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Modális párbeszédablak a natív `<dialog>` elemmel. A böngésző adja a
 * fókuszcsapdát, az Esc kezelését és azt, hogy bezáráskor a fókusz
 * visszakerül a megnyitó elemre; ezeket nem kell kézzel újraírni.
 */
export function Dialog({ open, onClose, title, children }: Props) {
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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-slate-700 bg-slate-900 p-0 text-slate-100 backdrop:bg-slate-950/80"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold text-slate-100">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  )
}
