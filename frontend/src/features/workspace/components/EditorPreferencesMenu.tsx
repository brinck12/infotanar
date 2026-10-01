import { useEffect, useId, useRef, useState } from 'react'
import {
  FONT_SIZE_RANGE,
  type EditorPreferences,
  type EditorTheme,
} from '../editorPreferences'

interface Props {
  preferences: EditorPreferences
  onChange: (preferences: EditorPreferences) => void
}

const THEME_OPTIONS: ReadonlyArray<{ value: EditorTheme; label: string }> = [
  { value: 'dark', label: 'Sötét' },
  { value: 'high-contrast', label: 'Nagy kontrasztú' },
]

/**
 * A szerkesztő beállításai (#156) egy fogaskerék gomb mögött: betűméret, tabulátor,
 * sortörés, minimap, téma. Minden változás azonnal érvényes és mentődik. Esc vagy a
 * menün kívüli kattintás bezárja, és a fókusz a gombra tér vissza.
 */
export function EditorPreferencesMenu({ preferences, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    // Megnyitáskor a fókusz az első vezérlőre kerül, hogy billentyűzettel azonnal állítható legyen.
    panelRef.current?.querySelector<HTMLElement>('input, select')?.focus()

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const set = <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => onChange({ ...preferences, [key]: value })

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Szerkesztő beállításai"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 aria-expanded:bg-slate-800"
      >
        <GearIcon />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Szerkesztő beállításai"
          data-testid="editor-preferences"
          className="absolute right-0 z-10 mt-2 w-72 space-y-4 rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm shadow-xl"
        >
          <label className="block">
            <span className="mb-1 flex justify-between text-slate-300">
              Betűméret <span className="font-mono text-slate-200">{preferences.fontSize} px</span>
            </span>
            <input
              type="range"
              min={FONT_SIZE_RANGE.min}
              max={FONT_SIZE_RANGE.max}
              step={1}
              value={preferences.fontSize}
              onChange={(e) => set('fontSize', Number(e.target.value))}
              className="w-full accent-sky-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-slate-300">Tabulátor szélessége</span>
            <select
              value={preferences.tabSize}
              onChange={(e) => set('tabSize', e.target.value === '2' ? 2 : 4)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-100"
            >
              <option value={2}>2 szóköz</option>
              <option value={4}>4 szóköz</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-slate-300">Téma</span>
            <select
              value={preferences.theme}
              onChange={(e) => set('theme', e.target.value === 'high-contrast' ? 'high-contrast' : 'dark')}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-100"
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-slate-200">
            <input
              type="checkbox"
              checked={preferences.wordWrap}
              onChange={(e) => set('wordWrap', e.target.checked)}
              className="h-4 w-4 accent-sky-600"
            />
            Sortörés
          </label>

          <label className="flex items-center gap-2 text-slate-200">
            <input
              type="checkbox"
              checked={preferences.minimap}
              onChange={(e) => set('minimap', e.target.checked)}
              className="h-4 w-4 accent-sky-600"
            />
            Minimap
          </label>
        </div>
      )}
    </div>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5v2m0 11v2M2.5 10h2m11 0h2M4.7 4.7l1.4 1.4m7.8 7.8 1.4 1.4m0-10.6-1.4 1.4M6.1 13.9l-1.4 1.4" />
    </svg>
  )
}
