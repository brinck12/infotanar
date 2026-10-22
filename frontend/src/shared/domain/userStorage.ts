/**
 * A felhasználóhoz kötött localStorage-kulcsok egy helyen (PRIV-7). Kijelentkezéskor
 * és fióktörléskor mindet töröljük, hogy közös gépen ne maradjon személyes adat
 * (piszkozat, szóbeli önértékelés, utolsó feladat, célok).
 *
 * Új, felhasználónként tárolt kulcsot ide is fel kell venni.
 */
const userKeyPrefixes = (userId: number): string[] => [
  `infotanar.draft.v1.u${userId}.`,
  `infotanar.oral.v1.u${userId}.`,
  `infotanar.lastTask.v1.u${userId}`,
  `infotanar.preferences.v1.u${userId}`,
  `infotanar.practice.v1.u${userId}.`,
  `infotanar.workspace.split.${userId}`,
  `infotanar.rhythm.offer.v1.u${userId}`,
]

/** Törli a megadott felhasználó minden böngészőbeli adatát; tiltott tárhelyen nem tesz semmit. */
export function clearUserStorage(userId: number): void {
  try {
    const prefixes = userKeyPrefixes(userId)
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key !== null && prefixes.some((prefix) => key.startsWith(prefix))) doomed.push(key)
    }
    doomed.forEach((key) => localStorage.removeItem(key))
  } catch {
    // Tiltott tárhely: nincs mit törölni.
  }
}
