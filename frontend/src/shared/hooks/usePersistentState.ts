import { useCallback, useState } from 'react'

function read<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

/**
 * localStorage-ban megőrzött állapot. Tiltott vagy teli tárhelynél (privát
 * mód) csendben memóriában marad; sérült vagy idegen érték helyett a
 * kezdőértéket adja. A kulcs váltásakor (pl. másik felhasználó) újraolvas.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): [T, (value: T) => void] {
  const [state, setState] = useState(() => ({ key, value: read(key, fallback, isValid) }))

  // Kulcsváltáskor renderelés közben olvasunk újra (nem effektben), így nincs villanás.
  const current = state.key === key ? state : { key, value: read(key, fallback, isValid) }
  if (current !== state) setState(current)

  const persist = useCallback(
    (value: T) => {
      setState({ key, value })
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // A tárhely nem elérhető: a beállítás csak ebben a munkamenetben él.
      }
    },
    [key],
  )

  return [current.value, persist]
}
