import { Component, lazy, Suspense, type ReactNode } from 'react'
import type { LanguageKey } from '../../../types'
import { EditorSkeleton } from './EditorSkeleton'

/** Kívülről kért tartalomcsere; minden új `seq` pontosan egyszer hat. */
export interface EditorReplacement {
  value: string
  seq: number
  /** Visszavonható szerkesztésként (pl. visszaállítás), vagy új dokumentumként (pl. nyelvváltás). */
  undoable: boolean
}

export interface CodeEditorProps {
  language: LanguageKey
  /** A szerkesztő kezdőtartalma (csak mountkor számít). */
  initialValue: string
  onChange: (value: string) => void
  replace?: EditorReplacement
  readOnly?: boolean
}

/** A Monaco több megabájt: külön chunkban, csak a szerkesztőt mutató oldalakon töltődik le. */
const MonacoCodeEditor = lazy(async () => ({ default: (await import('./MonacoCodeEditor')).MonacoCodeEditor }))

/**
 * Kódszerkesztő (#150). Ez a könnyű burok azonnal megjelenik; a Monaco a
 * háttérben töltődik: addig váz látszik, sikertelen letöltésnél pedig
 * hibaüzenet újratöltés gombbal, nem üres doboz.
 */
export function CodeEditor(props: CodeEditorProps) {
  return (
    <div className="h-full overflow-hidden rounded-lg border border-slate-800">
      <EditorLoadBoundary>
        <Suspense fallback={<EditorSkeleton />}>
          <MonacoCodeEditor {...props} />
        </Suspense>
      </EditorLoadBoundary>
    </div>
  )
}

/**
 * Elkapja a szerkesztő betöltési hibáját (pl. megszakadt letöltés).
 *
 * Az újrapróbálás az oldal újratöltése: a Chrome a sikertelenül letöltött
 * modult az oldal élettartamára megjegyzi, egy újabb `import()` ugyanazt a
 * hibát adná vissza hálózati kérés nélkül.
 */
class EditorLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  override componentDidCatch(error: Error): void {
    console.error('A kódszerkesztő betöltése nem sikerült', error)
  }

  override render() {
    if (!this.state.failed) return this.props.children

    return (
      <div role="alert" data-testid="editor-load-error" className="flex h-full flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-200">A kódszerkesztőt nem sikerült betölteni. Ellenőrizd az internetkapcsolatot, majd próbáld újra.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-5 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
        >
          Újrapróbálás
        </button>
      </div>
    )
  }
}
