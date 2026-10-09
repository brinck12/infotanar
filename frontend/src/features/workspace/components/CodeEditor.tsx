import { Editor, type BeforeMount, type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import { MONACO_FONT, MONACO_THEME, monacoTheme } from '../../../shared/ui/codeTheme'
import type { LanguageKey } from '../../../types'

/** A futtatható nyelveken túl a weboldal feladat fájltípusai is szerkeszthetők. */
export type EditorLanguage = LanguageKey | 'html' | 'css'

/** A nyelvkulcs és a Monaco saját nyelvazonosítójának megfeleltetése. */
const MONACO_LANGUAGE: Record<EditorLanguage, string> = {
  python: 'python',
  csharp: 'csharp',
  sql: 'sql',
  html: 'html',
  css: 'css',
}

type MonacoEditor = Parameters<OnMount>[0]
type Monaco = Parameters<OnMount>[1]

/** Kívülről kért tartalomcsere; minden új `seq` pontosan egyszer hat. */
export interface EditorReplacement {
  value: string
  seq: number
  /** Visszavonható szerkesztésként (pl. visszaállítás), vagy új dokumentumként (pl. nyelvváltás). */
  undoable: boolean
}

interface Props {
  language: EditorLanguage
  /** A szerkesztő kezdőtartalma (csak mountkor számít). */
  initialValue: string
  onChange: (value: string) => void
  replace?: EditorReplacement
  readOnly?: boolean
}

/**
 * A szerkesztő a saját tartalmának gazdája (nem vezérelt `value`): a vezérelt
 * mód a @monaco-editor/react-ben minden renderkor visszaírja a propot, és ha
 * a gépelés gyorsabb a renderelésnél, elavult szöveget írna a modellbe.
 * A szülő az onChange-en követi a tartalmat, és csak a tényleges cseréket
 * (nyelvváltás, visszaállítás) kéri a `replace`-szel.
 *
 * Mindig LF sorvég: sortörés nélküli tartalom után a Monaco Windowson CRLF-re
 * válthat, és akkor a változatlan kiinduló kód is módosítottnak látszana.
 */
export function CodeEditor({ language, initialValue, onChange, replace, readOnly = false }: Props) {
  const editorRef = useRef<MonacoEditor | null>(null)
  const appliedSeq = useRef(replace?.seq ?? 0)

  // A sötét kódfelület saját témája a tokenekből (a Monaco alaptémája más háttérszínű).
  const beforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme(MONACO_THEME, monacoTheme())
  }

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    editor.onDidChangeModelContent(() => ensureLf(editor, monaco))
    ensureLf(editor, monaco)
  }

  useEffect(() => {
    const editor = editorRef.current
    const model = editor?.getModel()
    if (!replace || replace.seq === appliedSeq.current || !editor || !model) return
    appliedSeq.current = replace.seq

    if (replace.undoable) {
      editor.pushUndoStop()
      editor.executeEdits('replace', [{ range: model.getFullModelRange(), text: replace.value, forceMoveMarkers: true }])
      editor.pushUndoStop()
    } else {
      // Másik nyelv másik dokumentum: a visszavonási előzmény nem keveredhet.
      model.setValue(replace.value)
    }
  }, [replace])

  return (
    <div className="on-dark h-full overflow-hidden bg-code">
      <Editor
        height="100%"
        theme={MONACO_THEME}
        language={MONACO_LANGUAGE[language]}
        defaultValue={initialValue}
        beforeMount={beforeMount}
        onMount={onMount}
        onChange={(next) => onChange((next ?? '').replace(/\r\n/g, '\n'))}
        loading={<div className="p-4 text-15 text-code-soft">Szerkesztő betöltése…</div>}
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: MONACO_FONT,
          fontLigatures: false,
          lineHeight: 24,
          padding: { top: 16, bottom: 16 },
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          tabSize: 4,
          automaticLayout: true,
          renderWhitespace: 'selection',
        }}
      />
    </div>
  )
}

function ensureLf(editor: MonacoEditor, monaco: Monaco): void {
  const model = editor.getModel()
  if (model && model.getEOL() !== '\n') model.setEOL(monaco.editor.EndOfLineSequence.LF)
}
