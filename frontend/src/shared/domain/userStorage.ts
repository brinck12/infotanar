import { removeStored, storedKeys } from './localStore'

/**
 * A felhasználóhoz kötött localStorage-kulcsok egyetlen jegyzéke (PRIV-7). A kulcsokat
 * itt építjük, és kijelentkezéskor, fióktörléskor ugyanebből a jegyzékből töröljük
 * mindet, hogy közös gépen ne maradjon személyes adat. Új kulcscsalád felvétele
 * egy sor a `FAMILIES`-ben.
 */
const FAMILIES = {
  draft: 'infotanar.draft.v1',
  oral: 'infotanar.oral.v1',
  lastTask: 'infotanar.lastTask.v1',
  preferences: 'infotanar.preferences.v1',
  practice: 'infotanar.practice.v1',
  workspaceSplit: 'infotanar.workspace.split.v1',
  rhythmOffer: 'infotanar.rhythm.offer.v1',
  checkoutReturn: 'infotanar.checkoutReturn.v1',
} as const

type StorageFamily = keyof typeof FAMILIES

/** A kulcsokban szereplő felhasználóazonosító; vendégnél `guest`. */
export function userKeyOf(user: { id: number } | null): string {
  return user ? `u${user.id}` : 'guest'
}

/** Egy kulcs a családból: `<család>.<userKey>[.<rész>…]`. */
export function userStorageKey(family: StorageFamily, userKey: string, ...parts: Array<string | number>): string {
  return [FAMILIES[family], userKey, ...parts].join('.')
}

/** Törli a megadott felhasználó minden böngészőbeli adatát. */
export function clearUserStorage(userId: number): void {
  const userKey = userKeyOf({ id: userId })
  const roots = (Object.keys(FAMILIES) as StorageFamily[]).map((family) => userStorageKey(family, userKey))
  storedKeys((key) => roots.some((root) => key === root || key.startsWith(`${root}.`))).forEach(removeStored)
}
