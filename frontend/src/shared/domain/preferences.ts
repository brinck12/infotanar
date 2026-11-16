import type { Level } from '../../types'
import { readStoredJson, removeStored } from './localStore'
import { userStorageKey } from './userStorage'

/**
 * A tanuló céljai (szint, vizsgaidőszak, nyelv, heti óraszám). Belépve a
 * szerver őrzi (`GET/PUT /account/preferences`, lásd `features/onboarding`);
 * vendégnél, és amíg a végpont nem érhető el, a böngésző, felhasználónként.
 */
export type WeeklyHours = '1-2' | '3-4' | '5+'
export type StudyLanguage = 'python' | 'csharp'

export interface StudyPreferences {
  level: Level
  examPeriod: string
  language: StudyLanguage
  weeklyHours: WeeklyHours
}

export const EXAM_PERIODS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '2027-05', label: '2027. május–június' },
  { value: '2027-10', label: '2027. október–november' },
  { value: '2028-05', label: '2028. május–június' },
]

export const WEEKLY_HOURS: ReadonlyArray<{ value: WeeklyHours; label: string; tasksPerWeek: number }> = [
  { value: '1-2', label: '1–2 óra', tasksPerWeek: 1 },
  { value: '3-4', label: '3–4 óra', tasksPerWeek: 2 },
  { value: '5+', label: '5 óra vagy több', tasksPerWeek: 3 },
]

export const DEFAULT_PREFERENCES: StudyPreferences = {
  level: 'kozep',
  examPeriod: '2027-05',
  language: 'python',
  weeklyHours: '3-4',
}

export const preferencesKey = (userKey: string) => userStorageKey('preferences', userKey)

export function isStudyPreferences(value: unknown): value is StudyPreferences {
  if (typeof value !== 'object' || value === null) return false
  const prefs = value as Partial<StudyPreferences>
  return (
    (prefs.level === 'kozep' || prefs.level === 'emelt') &&
    EXAM_PERIODS.some((period) => period.value === prefs.examPeriod) &&
    (prefs.language === 'python' || prefs.language === 'csharp') &&
    WEEKLY_HOURS.some((option) => option.value === prefs.weeklyHours)
  )
}

/** A böngészőben mentett célok; `null`, ha nincs ilyen (vagy sérült, vagy a tárhely tiltott). */
export function readStoredPreferences(userKey: string): StudyPreferences | null {
  return readStoredJson(preferencesKey(userKey), isStudyPreferences)
}

/** A böngészőbeli példány törlése, miután a szerver átvette. */
export function forgetStoredPreferences(userKey: string): void {
  removeStored(preferencesKey(userKey))
}
