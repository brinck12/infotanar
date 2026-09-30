import type { LanguageKey, LessonProgressStatus, Level } from '../../types'

export const LANGUAGE_LABEL: Readonly<Record<LanguageKey, string>> = {
  python: 'Python 3',
  csharp: 'C#',
  sql: 'SQL (SQLite)',
}

export const LEVEL_LABEL: Readonly<Record<Level, string>> = {
  kozep: 'Középszint',
  emelt: 'Emelt szint',
}

export const LESSON_STATUS_LABEL: Readonly<Record<LessonProgressStatus, string>> = {
  not_started: 'Nem kezdted el',
  in_progress: 'Folyamatban',
  completed: 'Teljesítve',
}
