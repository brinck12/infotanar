import { useCallback, useState } from 'react'
import { readStoredJson, writeStoredJson } from '../domain/localStore'

/** Szöveg-szöveg párok objektuma (fájlnév → tartalom, cella → érték). */
export function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every((item) => typeof item === 'string')
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
  const [state, setState] = useState(() => ({ key, value: readStoredJson(key, isValid) ?? fallback }))

  // Kulcsváltáskor renderelés közben olvasunk újra (nem effektben), így nincs villanás.
  const current = state.key === key ? state : { key, value: readStoredJson(key, isValid) ?? fallback }
  if (current !== state) setState(current)

  const persist = useCallback(
    (value: T) => {
      setState({ key, value })
      writeStoredJson(key, value)
    },
    [key],
  )

  return [current.value, persist]
}
