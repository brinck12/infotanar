import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '../../../shared/ui/Button'

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
        className="flex flex-wrap items-center gap-2 rounded-md border-strong border-ink bg-sheet px-3 py-1.5 text-15"
      >
        <span>Elvesznek a módosításaid. Visszaállítod a kiinduló kódot?</span>
        <Button
          variant="danger"
          onClick={() => {
            onReset()
            close()
          }}
          onKeyDown={closeOnEscape}
        >
          Visszaállítom
        </Button>
        <Button ref={cancelRef} variant="secondary" onClick={close} onKeyDown={closeOnEscape}>
          Mégse
        </Button>
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
      className="min-h-11 px-1 text-16 font-semibold text-ink-soft underline underline-offset-4 hover:text-ink disabled:text-muted disabled:no-underline"
    >
      Kiinduló kód visszaállítása
    </button>
  )
}
