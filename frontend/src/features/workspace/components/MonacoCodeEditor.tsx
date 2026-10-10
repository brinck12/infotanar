import { Editor, type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import type { LanguageKey } from '../../../types'
import { configureBundledMonaco } from '../monaco'
import type { CodeEditorProps } from './CodeEditor'
import { EditorSkeleton } from './EditorSkeleton'

/** A nyelvkulcs és a Monaco saját nyelvazonosítójának megfeleltetése. */
const MONACO_LANGUAGE: Record<LanguageKey, string> = {
  python: 'python',
  csharp: 'csharp',
  sql: 'sql',
}

type MonacoEditor = Parameters<OnMount>[0]
type Monaco = Parameters<OnMount>[1]

// Egyszer, a modul betöltésekor: innentől nincs CDN-letöltés.
configureBundledMonaco()

/**
 * A tényleges Monaco szerkesztő. Közvetlenül ne importáld: a `CodeEditor`
 * tölti be lustán, mert ez a modul húzza be a teljes Monacót.
 *
 * A szerkesztő a saját tartalmának gazdája (nem vezérelt `value`): a vezérelt
 * mód a @monaco-editor/react-ben minden renderkor visszaírja a propot, és ha
 * a gépelés gyorsabb a renderelésnél, elavult szöveget írna a modellbe.
 * A szülő az onChange-en követi a tartalmat, és csak a tényleges cseréket
 * (nyelvváltás, visszaállítás) kéri a `replace`-szel.
 *
 * Mindig LF sorvég: sortörés nélküli tartalom után a Monaco Windowson CRLF-re
 * válthat, és akkor a változatlan kiinduló kód is módosítottnak látszana.
 */
export function MonacoCodeEditor({ language, initialValue, onChange, replace, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<MonacoEditor | null>(null)
  const appliedSeq = useRef(replace?.seq ?? 0)

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
      if (replace.resetTo !== undefined) model.setValue(replace.resetTo)
      editor.pushUndoStop()
      editor.executeEdits('replace', [{ range: model.getFullModelRange(), text: replace.value, forceMoveMarkers: true }])
      editor.pushUndoStop()
    } else {
      // Másik nyelv másik dokumentum: a visszavonási előzmény nem keveredhet.
      model.setValue(replace.value)
    }
  }, [replace])

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={MONACO_LANGUAGE[language]}
      defaultValue={initialValue}
      onMount={onMount}
      onChange={(next) => onChange((next ?? '').replace(/\r\n/g, '\n'))}
      loading={<EditorSkeleton />}
      options={{
        readOnly,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 4,
        automaticLayout: true,
        renderWhitespace: 'selection',
      }}
    />
  )
}

function ensureLf(editor: MonacoEditor, monaco: Monaco): void {
  const model = editor.getModel()
  if (model && model.getEOL() !== '\n') model.setEOL(monaco.editor.EndOfLineSequence.LF)
}
