/**
 * A localStorage egyetlen kapuja, amely soha nem dob. Privát módban, letiltott vagy teli
 * tárhelynél a böngésző kivételt dob; minden itt tárolt adat kényelmi funkció, ezért ilyenkor
 * az olvasás `null`-t ad, az írás és a törlés pedig nem tesz semmit.
 */

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Teli vagy tiltott tárhely: az adat csak a memóriában él.
  }
}

export function removeStored(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Tiltott tárhely: nincs mit törölni.
  }
}

/** A tárolt JSON, ha van, értelmezhető és megfelel az ellenőrzésnek; különben `null`. */
export function readStoredJson<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  const raw = readStored(key)
  if (raw === null) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  writeStored(key, JSON.stringify(value))
}

/** A tárolt kulcsok, amelyekre a feltétel igaz (tiltott tárhelyen üres). */
export function storedKeys(matches: (key: string) => boolean): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key !== null && matches(key)) keys.push(key)
    }
    return keys
  } catch {
    return []
  }
}
