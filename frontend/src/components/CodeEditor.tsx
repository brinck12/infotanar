import Editor from '@monaco-editor/react'
import type { LanguageKey } from '../types'

/** A nyelvkulcs és a Monaco saját nyelvazonosítójának megfeleltetése. */
const MONACO_LANGUAGE: Record<LanguageKey, string> = {
  python: 'python',
  csharp: 'csharp',
}

interface Props {
  language: LanguageKey
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function CodeEditor({ language, value, onChange, readOnly = false }: Props) {
  return (
    <div className="h-full overflow-hidden rounded-lg border border-slate-800">
      <Editor
        height="100%"
        theme="vs-dark"
        language={MONACO_LANGUAGE[language]}
        value={value}
        onChange={(next) => onChange(next ?? '')}
        loading={<div className="p-4 text-sm text-slate-400">Szerkesztő betöltése…</div>}
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
    </div>
  )
}
