import { useSyncExternalStore } from 'react'
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
  try {
    const stored = localStorage.getItem(KEY)
    current = isLanguage(stored) ? stored : DEFAULT_LANGUAGE
  } catch {
    // Tiltott tárhely: marad az alapérték, és a választás csak az oldal életére szól.
    current = DEFAULT_LANGUAGE
  }

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
  try {
    localStorage.setItem(KEY, language)
  } catch {
    // Tiltott tárhely: a választás csak a memóriában él.
  }
  listeners.forEach((listener) => listener())
}

/** A leckeszövegek kódfüleinek közös nyelvválasztása: az oldal összes fülsora együtt vált, és megmarad. */
export function useLessonLanguage(): readonly [StudyLanguage, (language: StudyLanguage) => void] {
  const language = useSyncExternalStore(subscribe, read, () => DEFAULT_LANGUAGE)

  return [language, write] as const
}
