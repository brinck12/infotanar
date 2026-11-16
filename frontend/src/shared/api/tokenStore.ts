import { readStored, removeStored, writeStored } from '../domain/localStore'

const TOKEN_KEY = 'infotanar.token'

/**
 * A Sanctum token tárolása. Ha a localStorage nem elérhető (privát mód,
 * letiltott tárhely), memóriában tartjuk: a munkamenet a lap bezárásáig él.
 */
let memoryToken: string | null = null

export const tokenStore = {
  get(): string | null {
    return readStored(TOKEN_KEY) ?? memoryToken
  },
  set(token: string | null): void {
    memoryToken = token
    if (token) writeStored(TOKEN_KEY, token)
    else removeStored(TOKEN_KEY)
  },
}
