import { useEffect, useRef } from 'react'

/**
 * Munkaterület-billentyűk (#156): Ctrl/Cmd+Enter futtat, Ctrl/Cmd+Shift+Enter bead.
 * A szerkesztőn belül a Monaco-akciók (CodeEditor) kezelik, mert a Monaco a saját
 * Ctrl+Enter-ét (új sor) felülírja; ez a kezelő az oldal többi részén (pl. gombon
 * vagy szövegmezőben álló fókusznál) működik.
 */

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
const MOD_LABEL = isMac ? '⌘' : 'Ctrl'

export const RUN_SHORTCUT = {
  /** Gombfelirat/tooltip. */
  label: `${MOD_LABEL}+Enter`,
  /** `aria-keyshortcuts`: mindkét platform módosítója szerepel. */
  aria: 'Control+Enter Meta+Enter',
} as const

export const SUBMIT_SHORTCUT = {
  label: `${MOD_LABEL}+Shift+Enter`,
  aria: 'Control+Shift+Enter Meta+Shift+Enter',
} as const

/** Esc, majd Tab: kilépés a szerkesztőből (WCAG 2.1.2, nincs billentyűzet-csapda). */
export const LEAVE_EDITOR_HINT = 'Esc, majd Tab: kilépés a szerkesztőből.'

interface ShortcutHandlers {
  run: () => void
  submit: () => void
}

/**
 * Oldalszintű Ctrl/Cmd+Enter és Ctrl/Cmd+Shift+Enter. A kezelők a legutóbbi
 * renderből jönnek (ref), így az eseményfigyelő nem épül újra minden rendernél.
 * A már kezelt eseményt (pl. a szerkesztő akcióját) nem dolgozza fel még egyszer.
 */
export function useWorkspaceShortcuts(handlers: ShortcutHandlers): void {
  const latest = useRef(handlers)

  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      if (e.shiftKey) latest.current.submit()
      else latest.current.run()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
