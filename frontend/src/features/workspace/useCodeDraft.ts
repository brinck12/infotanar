import { useCallback, useEffect, useRef, useState } from 'react'
import type { LanguageKey, UnlockedTaskDetail } from '../../types'
import { loadDraft, loadLastLanguage, pruneDrafts, saveDraft, saveLastLanguage, type DraftScope } from './drafts'

const SAVE_DELAY_MS = 400

interface EditorState {
  language: LanguageKey
  code: string
  /** A betöltött kód egy korábbi piszkozatból jött-e (a felület jelzi). */
  restored: boolean
}

interface CodeDraft extends EditorState {
  starterCode: string
  setCode: (code: string) => void
  /** Nyelvváltás; az új nyelv betöltött kódját (piszkozat vagy kiinduló kód) adja vissza. */
  changeLanguage: (language: LanguageKey) => string
  resetToStarter: () => void
}

/**
 * A szerkesztő tartalma piszkozat-mentéssel (#33). Gépelés közben ritkítva
 * ment, a lap elhagyásakor (pagehide), nyelvváltáskor és unmountkor azonnal;
 * nyelvváltáskor az adott nyelv saját piszkozatát (vagy kiinduló kódját)
 * tölti be.
 *
 * Az aktuális állapot egy refben is él, amelyet a setterek szinkron
 * frissítenek: a mentés így nem függ attól, hogy a React már lerenderelte-e
 * az utolsó billentyűleütést (gyors gépelés után azonnali nyelvváltásnál ez
 * különben elavult piszkozatot mentene).
 */
export function useCodeDraft(task: UnlockedTaskDetail, userKey: string): CodeDraft {
  // A hívó feladat- és felhasználóváltáskor újramountol (key), így a hatókör állandó.
  const [scope] = useState<DraftScope>(() => ({ userKey, taskId: task.id }))
  const starterFor = useCallback((language: LanguageKey) => task.starter_code[language] ?? '', [task.starter_code])

  const [state, setState] = useState<EditorState>(() => {
    pruneDrafts()
    const language = loadLastLanguage(scope, task.allowed_languages) ?? task.allowed_languages[0] ?? 'python'
    const draft = loadDraft(scope, language)
    return { language, code: draft?.code ?? starterFor(language), restored: draft !== null }
  })

  const current = useRef(state)
  const timer = useRef<number | null>(null)

  const update = useCallback((next: EditorState) => {
    current.current = next
    setState(next)
  }, [])

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    const { language, code } = current.current
    saveDraft(scope, language, code, starterFor(language))
  }, [scope, starterFor])

  useEffect(() => {
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  const schedule = useCallback(
    (delay: number) => {
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, delay)
    },
    [flush],
  )

  const setCode = useCallback(
    (code: string) => {
      update({ ...current.current, code })
      schedule(SAVE_DELAY_MS)
    },
    [schedule, update],
  )

  const changeLanguage = useCallback(
    (language: LanguageKey) => {
      flush()
      const draft = loadDraft(scope, language)
      saveLastLanguage(scope, language)
      const code = draft?.code ?? starterFor(language)
      update({ language, code, restored: draft !== null })
      return code
    },
    [flush, scope, starterFor, update],
  )

  const resetToStarter = useCallback(() => {
    update({ ...current.current, code: starterFor(current.current.language), restored: false })
    flush()
  }, [flush, starterFor, update])

  return { ...state, starterCode: starterFor(state.language), setCode, changeLanguage, resetToStarter }
}
