import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'

interface ConfirmActionProps {
  /** A gomb felirata, pl. „Munkamenetek lezárása”. */
  label: string
  /** A megerősítő kérdés, pl. „Biztosan kijelentkezteted mindenhol?”. */
  question: string
  confirmLabel: string
  busy: boolean
  /** Visszafordíthatatlan vagy kockázatos műveletnél piros a megerősítő gomb. */
  danger?: boolean
  onConfirm: () => void
}

/**
 * Egy gomb, amely kattintásra megerősítő ablakot nyit, és csak a megerősítés
 * után hívja az `onConfirm`-ot. Az ablakban a „Mégsem” áll elöl, így egy
 * véletlen Enter nem hajtja végre a műveletet.
 */
export function ConfirmAction({ label, question, confirmLabel, busy, danger = false, onConfirm }: ConfirmActionProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <Button variant={danger ? 'text-danger' : 'secondary'} disabled={busy} onClick={() => setConfirming(true)}>
        {label}
      </Button>
      <Modal
        open={confirming}
        title={label}
        onClose={() => setConfirming(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Mégsem
            </Button>
            <Button
              variant={danger ? 'danger' : 'primary'}
              disabled={busy}
              onClick={() => {
                setConfirming(false)
                onConfirm()
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <p>{question}</p>
      </Modal>
    </>
  )
}
