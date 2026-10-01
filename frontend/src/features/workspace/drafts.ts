import type { LanguageKey } from '../../types'

/**
 * Szerkesztő-piszkozatok a böngészőben (#33): felhasználónként, feladatonként
 * és nyelvenként, hogy frissítés vagy véletlen fülbezárás után se vesszen el
 * a félkész megoldás. Csak kliensoldali kényelmi funkció: tiltott vagy teli
 * tárhelynél csendben nem ment.
 */

const PREFIX = 'infotanar.draft.v1.'
/** Ennél régebbi piszkozatot nem tartunk meg (a tárhely véges). */
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000
/** A backend is 64 KB körül korlátozza a forráskódot; nagyobbat nem érdemes menteni. */
const MAX_CODE_LENGTH = 64_000
/** A backend a saját bemenetet 65 536 karakterig fogadja. */
export const MAX_CUSTOM_INPUT_LENGTH = 65_536

interface StoredDraft {
  code: string
  savedAt: number
}

export interface DraftScope {
  userKey: string
  taskId: number
}

const codeKey = (scope: DraftScope, language: LanguageKey) => `${PREFIX}${scope.userKey}.${scope.taskId}.${language}`
const languageKey = (scope: DraftScope) => `${PREFIX}${scope.userKey}.${scope.taskId}.lang`
const inputKey = (scope: DraftScope) => `${PREFIX}${scope.userKey}.${scope.taskId}.stdin`

function isStoredDraft(value: unknown): value is StoredDraft {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as StoredDraft).code === 'string' &&
    typeof (value as StoredDraft).savedAt === 'number'
  )
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Teli vagy tiltott tárhely: a piszkozat csak a memóriában él.
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nincs teendő.
  }
}

export function loadDraft(scope: DraftScope, language: LanguageKey): StoredDraft | null {
  const value = readJson(codeKey(scope, language))
  return isStoredDraft(value) && Date.now() - value.savedAt < MAX_AGE_MS ? value : null
}

/** A kiinduló kóddal egyező tartalomhoz nem kell piszkozat: törli a régit. */
export function saveDraft(scope: DraftScope, language: LanguageKey, code: string, starterCode: string): void {
  if (code === starterCode || code.length > MAX_CODE_LENGTH) {
    remove(codeKey(scope, language))
    return
  }
  write(codeKey(scope, language), { code, savedAt: Date.now() } satisfies StoredDraft)
}

/**
 * A "Saját bemenet" szövege (#153), feladatonként (nem nyelvenként). Ugyanazt a
 * tárolási alakot használja, mint a kód, így a lejárat és a takarítás közös.
 */
export function loadCustomInput(scope: DraftScope): string {
  const value = readJson(inputKey(scope))
  return isStoredDraft(value) && Date.now() - value.savedAt < MAX_AGE_MS ? value.code : ''
}

export function saveCustomInput(scope: DraftScope, text: string): void {
  if (text === '') {
    remove(inputKey(scope))
    return
  }
  write(inputKey(scope), { code: text, savedAt: Date.now() } satisfies StoredDraft)
}

export function loadLastLanguage(scope: DraftScope, allowed: readonly LanguageKey[]): LanguageKey | null {
  const value = readJson(languageKey(scope))
  return allowed.find((language) => language === value) ?? null
}

export function saveLastLanguage(scope: DraftScope, language: LanguageKey): void {
  write(languageKey(scope), language)
}

let pruned = false

/** Munkamenetenként egyszer eltávolítja a lejárt vagy sérült piszkozatokat. */
export function pruneDrafts(): void {
  if (pruned) return
  pruned = true
  try {
    const stale: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(PREFIX) || key.endsWith('.lang')) continue
      const value = readJson(key)
      if (!isStoredDraft(value) || Date.now() - value.savedAt >= MAX_AGE_MS) stale.push(key)
    }
    stale.forEach(remove)
  } catch {
    // Nincs teendő.
  }
}
