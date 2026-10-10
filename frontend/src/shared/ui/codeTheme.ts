/** A sötét kódfelület színei a Monaco számára: a CSS tokenekből olvassuk ki, nem írjuk le újra. */
export const MONACO_THEME = 'infotanar'

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim()
}

/** A Monaco szabályai `#` nélküli hexát várnak. */
function bare(name: string): string {
  return token(name).replace('#', '')
}

export interface MonacoThemeData {
  base: 'vs-dark'
  inherit: boolean
  rules: Array<{ token: string; foreground: string }>
  colors: Record<string, string>
}

export function monacoTheme(): MonacoThemeData {
  return {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: bare('code-text') },
      { token: 'keyword', foreground: bare('code-keyword') },
      { token: 'number', foreground: bare('code-number') },
      { token: 'comment', foreground: bare('code-comment') },
      { token: 'string', foreground: bare('code-builtin') },
      { token: 'type', foreground: bare('code-builtin') },
      { token: 'predefined', foreground: bare('code-builtin') },
    ],
    colors: {
      'editor.background': token('code'),
      'editor.foreground': token('code-text'),
      'editorLineNumber.foreground': token('code-edge'),
      'editorLineNumber.activeForeground': token('code-soft'),
      'editor.lineHighlightBackground': token('code-deep'),
      'editorGutter.background': token('code'),
      'editorCursor.foreground': token('code-builtin'),
    },
  }
}

export const MONACO_FONT = '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace'
