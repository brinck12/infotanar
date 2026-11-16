import { readStoredJson, removeStored, storedKeys, writeStoredJson } from '../../shared/domain/localStore'
import { userStorageKey } from '../../shared/domain/userStorage'
import type { LanguageKey } from '../../types'

/**
 * Szerkesztő-piszkozatok a böngészőben (#33): felhasználónként, feladatonként
 * és nyelvenként, hogy frissítés vagy véletlen fülbezárás után se vesszen el
 * a félkész megoldás. Csak kliensoldali kényelmi funkció: tiltott vagy teli
 * tárhelynél csendben nem ment.
 */

const DRAFT_ROOT = userStorageKey('draft', '')
/** Ennél régebbi piszkozatot nem tartunk meg (a tárhely véges). */
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000
/** A backend is 64 KB körül korlátozza a forráskódot; nagyobbat nem érdemes menteni. */
const MAX_CODE_LENGTH = 64_000

interface StoredDraft {
  code: string
  savedAt: number
}

export interface DraftScope {
  userKey: string
  taskId: number
}

const codeKey = (scope: DraftScope, language: LanguageKey) => userStorageKey('draft', scope.userKey, scope.taskId, language)
const languageKey = (scope: DraftScope) => userStorageKey('draft', scope.userKey, scope.taskId, 'lang')

function isStoredDraft(value: unknown): value is StoredDraft {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as StoredDraft).code === 'string' &&
    typeof (value as StoredDraft).savedAt === 'number'
  )
}

const isFresh = (draft: StoredDraft) => Date.now() - draft.savedAt < MAX_AGE_MS

export function loadDraft(scope: DraftScope, language: LanguageKey): StoredDraft | null {
  const draft = readStoredJson(codeKey(scope, language), isStoredDraft)
  return draft !== null && isFresh(draft) ? draft : null
}

/** A kiinduló kóddal egyező tartalomhoz nem kell piszkozat: törli a régit. */
export function saveDraft(scope: DraftScope, language: LanguageKey, code: string, starterCode: string): void {
  if (code === starterCode || code.length > MAX_CODE_LENGTH) {
    removeStored(codeKey(scope, language))
    return
  }
  writeStoredJson(codeKey(scope, language), { code, savedAt: Date.now() } satisfies StoredDraft)
}

export function loadLastLanguage(scope: DraftScope, allowed: readonly LanguageKey[]): LanguageKey | null {
  const value = readStoredJson(languageKey(scope), (stored): stored is string => typeof stored === 'string')
  return allowed.find((language) => language === value) ?? null
}

export function saveLastLanguage(scope: DraftScope, language: LanguageKey): void {
  writeStoredJson(languageKey(scope), language)
}

let pruned = false

/** Munkamenetenként egyszer eltávolítja a lejárt vagy sérült piszkozatokat. */
export function pruneDrafts(): void {
  if (pruned) return
  pruned = true
  storedKeys((key) => key.startsWith(DRAFT_ROOT) && !key.endsWith('.lang'))
    .filter((key) => {
      const draft = readStoredJson(key, isStoredDraft)
      return draft === null || !isFresh(draft)
    })
    .forEach(removeStored)
}
