import type { LanguageKey, Level } from '../../types'

export const LANGUAGE_LABEL: Readonly<Record<LanguageKey, string>> = {
  python: 'Python 3',
  csharp: 'C#',
}

export const LEVEL_LABEL: Readonly<Record<Level, string>> = {
  kozep: 'Középszint',
  emelt: 'Emelt szint',
}
