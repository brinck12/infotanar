import { usePersistentState } from '../../shared/hooks/usePersistentState'

/** A szerkesztő felhasználónkénti beállításai (#156); minden feladatnál ugyanazok érvényesek. */
export interface EditorPreferences {
  /** px; vetítőn és gyengénlátóknak. */
  fontSize: number
  tabSize: 2 | 4
  wordWrap: boolean
  minimap: boolean
  theme: EditorTheme
}

export type EditorTheme = 'dark' | 'high-contrast'

export const FONT_SIZE_RANGE = { min: 12, max: 24 } as const

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: false,
  theme: 'dark',
}

/** A Monaco beépített témái: sötét, illetve nagy kontrasztú. */
export const MONACO_THEME: Readonly<Record<EditorTheme, string>> = {
  dark: 'vs-dark',
  'high-contrast': 'hc-black',
}

export function isEditorPreferences(value: unknown): value is EditorPreferences {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.fontSize === 'number' &&
    Number.isInteger(candidate.fontSize) &&
    candidate.fontSize >= FONT_SIZE_RANGE.min &&
    candidate.fontSize <= FONT_SIZE_RANGE.max &&
    (candidate.tabSize === 2 || candidate.tabSize === 4) &&
    typeof candidate.wordWrap === 'boolean' &&
    typeof candidate.minimap === 'boolean' &&
    (candidate.theme === 'dark' || candidate.theme === 'high-contrast')
  )
}

/**
 * A mentett beállítások felhasználónként (mint a panelarány). Sérült vagy régi
 * alakú érték helyett az alapértelmezés jön; tiltott tárhelynél a munkamenetben él.
 */
export function useEditorPreferences(userKey: string): [EditorPreferences, (value: EditorPreferences) => void] {
  return usePersistentState(`infotanar.workspace.editor.${userKey}`, DEFAULT_EDITOR_PREFERENCES, isEditorPreferences)
}
