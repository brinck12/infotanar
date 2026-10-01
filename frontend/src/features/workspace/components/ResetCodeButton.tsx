import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

interface Props {
  /** Eltér-e a szerkesztő tartalma a kiinduló kódtól (különben nincs mit visszaállítani). */
  dirty: boolean
  disabled?: boolean
  onReset: () => void
}

/**
 * Visszaállítás a feladat kiinduló kódjára (#32). A módosítások elvesznek,
 * ezért helyben megerősítést kér (nem natív `confirm`, hogy akadálymentes és
 * a felülettel egységes legyen). A megerősítő sor Escape-re bezárul, és a
 * fókusz a „Mégse” gombra kerül, így véletlen Enter nem töröl.
 */
export function ResetCodeButton({ dirty, disabled = false, onReset }: Props) {
  const [confirming, setConfirming] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const wasConfirming = useRef(false)

  // Megnyitáskor a „Mégse” kap fókuszt, bezáráskor visszakerül a gombra.
  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
    else if (wasConfirming.current) triggerRef.current?.focus()
    wasConfirming.current = confirming
  }, [confirming])

  function close() {
    setConfirming(false)
  }

  function closeOnEscape(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Escape') close()
  }

  if (confirming) {
    return (
      <div
        role="group"
        aria-label="Visszaállítás megerősítése"
        data-testid="reset-confirm"
        className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-800 bg-amber-950/60 px-3 py-1.5 text-sm text-amber-100"
      >
        <span>Elvesznek a módosításaid. Visszaállítod a kiinduló kódot?</span>
        <button
          type="button"
          onClick={() => {
            onReset()
            close()
          }}
          onKeyDown={closeOnEscape}
          className="rounded-md bg-amber-700 px-3 py-1 font-medium text-white transition hover:bg-amber-600"
        >
          Igen, visszaállítom
        </button>
        <button
          ref={cancelRef}
          type="button"
          onClick={close}
          onKeyDown={closeOnEscape}
          className="rounded-md border border-amber-800 px-3 py-1 transition hover:bg-amber-900"
        >
          Mégse
        </button>
      </div>
    )
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setConfirming(true)}
      disabled={disabled || !dirty}
      title={dirty ? 'A szerkesztő tartalmának visszaállítása a kiinduló kódra' : 'A kód megegyezik a kiinduló kóddal'}
      data-testid="reset-code"
      className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Kiinduló kód visszaállítása
    </button>
  )
}
