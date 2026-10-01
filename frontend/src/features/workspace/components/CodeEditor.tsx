import { Editor, type OnMount } from '@monaco-editor/react'
import { useEffect, useId, useRef } from 'react'
import type { LanguageKey } from '../../../types'
import { DEFAULT_EDITOR_PREFERENCES, MONACO_THEME, type EditorPreferences } from '../editorPreferences'
import { LEAVE_EDITOR_HINT } from '../shortcuts'

/** A nyelvkulcs és a Monaco saját nyelvazonosítójának megfeleltetése. */
const MONACO_LANGUAGE: Record<LanguageKey, string> = {
  python: 'python',
  csharp: 'csharp',
  sql: 'sql',
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
  language: LanguageKey
  /** A szerkesztő kezdőtartalma (csak mountkor számít). */
  initialValue: string
  onChange: (value: string) => void
  replace?: EditorReplacement
  readOnly?: boolean
  /** Megjelenés: betűméret, tabulátor, sortörés, minimap, téma. Alapértelmezés, ha nincs megadva. */
  preferences?: EditorPreferences
  /** Ctrl/Cmd+Enter és Ctrl/Cmd+Shift+Enter a szerkesztőn belül (#156); megadva regisztrálódnak. */
  onRun?: () => void
  onSubmit?: () => void
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
 *
 * Billentyűzetes használat (#156): a futtatás/beadás gyorsbillentyűk Monaco-akciók
 * (a Monaco saját Ctrl+Enter-ét felülírják). Az Esc, majd Tab kilép a szerkesztőből,
 * hogy a billentyűzetes felhasználó ne ragadjon benne.
 */
export function CodeEditor({
  language,
  initialValue,
  onChange,
  replace,
  readOnly = false,
  preferences = DEFAULT_EDITOR_PREFERENCES,
  onRun,
  onSubmit,
}: Props) {
  const hintId = useId()
  const editorRef = useRef<MonacoEditor | null>(null)
  const appliedSeq = useRef(replace?.seq ?? 0)
  // A Monaco-akciók mountkor regisztrálódnak: a legutóbbi kezelőket refen át érik el.
  const shortcuts = useRef({ onRun, onSubmit })

  useEffect(() => {
    shortcuts.current = { onRun, onSubmit }
  })

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    editor.onDidChangeModelContent(() => ensureLf(editor, monaco))
    ensureLf(editor, monaco)
    registerShortcuts(editor, monaco, shortcuts)
    allowLeavingWithTab(editor, monaco)
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
    <div role="group" aria-label="Kódszerkesztő" aria-describedby={hintId} className="h-full overflow-hidden rounded-lg border border-slate-800">
      <p id={hintId} className="sr-only">
        {LEAVE_EDITOR_HINT}
      </p>
      <Editor
        height="100%"
        theme={MONACO_THEME[preferences.theme]}
        language={MONACO_LANGUAGE[language]}
        defaultValue={initialValue}
        onMount={onMount}
        onChange={(next) => onChange((next ?? '').replace(/\r\n/g, '\n'))}
        loading={<div className="p-4 text-sm text-slate-400">Szerkesztő betöltése…</div>}
        options={{
          readOnly,
          fontSize: preferences.fontSize,
          minimap: { enabled: preferences.minimap },
          wordWrap: preferences.wordWrap ? 'on' : 'off',
          scrollBeyondLastLine: false,
          tabSize: preferences.tabSize,
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

/** Ctrl/Cmd+Enter = Futtatás, Ctrl/Cmd+Shift+Enter = Beadás; csak ha a szülő megadta a kezelőt. */
function registerShortcuts(
  editor: MonacoEditor,
  monaco: Monaco,
  shortcuts: { current: { onRun?: () => void; onSubmit?: () => void } },
): void {
  if (!shortcuts.current.onRun && !shortcuts.current.onSubmit) return

  editor.addAction({
    id: 'infotanar.run',
    label: 'Futtatás',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    run: () => shortcuts.current.onRun?.(),
  })
  editor.addAction({
    id: 'infotanar.submit',
    label: 'Beadás',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
    run: () => shortcuts.current.onSubmit?.(),
  })
}

/**
 * Esc, majd Tab: a Tab ilyenkor a fókuszt viszi tovább, nem tabulátort ír (Monaco
 * `tabFocusMode`). Bármely más billentyű, vagy a fókusz elvesztése visszaállítja a
 * szokásos viselkedést, így a Tab-os behúzás nem romlik el.
 */
function allowLeavingWithTab(editor: MonacoEditor, monaco: Monaco): void {
  // A módosító billentyű önmagában nem szakítja meg a sort: a Shift+Tab is kilép (Shift előbb jön, mint a Tab).
  const keepsMode = new Set([monaco.KeyCode.Tab, monaco.KeyCode.Shift, monaco.KeyCode.Ctrl, monaco.KeyCode.Alt, monaco.KeyCode.Meta])

  editor.onKeyDown((event) => {
    if (event.keyCode === monaco.KeyCode.Escape) {
      editor.updateOptions({ tabFocusMode: true })
    } else if (!keepsMode.has(event.keyCode)) {
      editor.updateOptions({ tabFocusMode: false })
    }
  })
  editor.onDidBlurEditorText(() => editor.updateOptions({ tabFocusMode: false }))
}
