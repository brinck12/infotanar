import { useSyncExternalStore } from 'react'
import { readStored, writeStored } from './localStore'
import type { StudyLanguage } from './preferences'

// Szándékosan nem felhasználóhoz kötött (nincs a userStorage.ts-ben): nem személyes adat, csak eszközönkénti megjelenítési beállítás.
const KEY = 'infotanar.lessonLanguage.v1'
const DEFAULT_LANGUAGE: StudyLanguage = 'python'

let current: StudyLanguage | null = null
const listeners = new Set<() => void>()

function isLanguage(value: unknown): value is StudyLanguage {
  return value === 'python' || value === 'csharp'
}

function read(): StudyLanguage {
  if (current !== null) return current
  const stored = readStored(KEY)
  current = isLanguage(stored) ? stored : DEFAULT_LANGUAGE

  return current
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function write(language: StudyLanguage): void {
  current = language
  writeStored(KEY, language)
  listeners.forEach((listener) => listener())
}

/** A leckeszövegek kódfüleinek közös nyelvválasztása: az oldal összes fülsora együtt vált, és megmarad. */
export function useLessonLanguage(): readonly [StudyLanguage, (language: StudyLanguage) => void] {
  const language = useSyncExternalStore(subscribe, read, () => DEFAULT_LANGUAGE)

  return [language, write] as const
}
