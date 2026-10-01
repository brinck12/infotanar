import { useCallback, useState } from 'react'
import { loadCustomInput, saveCustomInput, type DraftScope } from './drafts'

interface CustomInput {
  /** A "Saját bemenet" szerkesztő nyitva van-e: ilyenkor a Futtatás ezzel a bemenettel fut. */
  open: boolean
  text: string
  setOpen: (open: boolean) => void
  setText: (text: string) => void
}

/**
 * A "Saját bemenet" (#153) állapota. A szöveg feladatonként megmarad
 * újratöltés után is; ha volt mentett bemenet, a szerkesztő nyitva indul.
 *
 * Minden módosítás azonnal mentődik: a szöveg legfeljebb 64 KB, a
 * localStorage-írás ehhez elég olcsó, és nincs mit elveszíteni.
 */
export function useCustomInput(userKey: string, taskId: number): CustomInput {
  // A hívó feladat- és felhasználóváltáskor újramountol (key), így a hatókör állandó.
  const [scope] = useState<DraftScope>(() => ({ userKey, taskId }))
  const [text, setTextState] = useState(() => loadCustomInput(scope))
  const [open, setOpen] = useState(() => text !== '')

  const setText = useCallback(
    (next: string) => {
      setTextState(next)
      saveCustomInput(scope, next)
    },
    [scope],
  )

  return { open, text, setOpen, setText }
}
