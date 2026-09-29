const TOKEN_KEY = 'infotanar.token'

/**
 * A Sanctum token tárolása. Ha a localStorage nem elérhető (privát mód,
 * letiltott tárhely), memóriában tartjuk: a munkamenet a lap bezárásáig él.
 */
let memoryToken: string | null = null

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? memoryToken
    } catch {
      return memoryToken
    }
  },
  set(token: string | null): void {
    memoryToken = token
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      // A memóriabeli példány elég a munkamenet végéig.
    }
  },
}
