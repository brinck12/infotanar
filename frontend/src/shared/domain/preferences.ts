import type { Level } from '../../types'

/**
 * A tanuló céljai (szint, vizsgaidőszak, nyelv, heti óraszám). Amíg a szerveren
 * nincs hozzá mező (`users.preferences`), a böngészőben tároljuk, felhasználónként.
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

export const preferencesKey = (userKey: string) => `infotanar.preferences.v1.${userKey}`

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
