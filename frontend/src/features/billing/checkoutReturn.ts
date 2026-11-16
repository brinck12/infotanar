import { readStored, removeStored, writeStored } from '../../shared/domain/localStore'
import { userStorageKey } from '../../shared/domain/userStorage'
import { localPath } from '../../shared/navigation'

/**
 * A fizetés a Barion oldalán át megy, ezért a router állapota elvész. Az oldal, ahonnan a
 * felhasználó az előfizetéshez indult (pl. egy zárolt lecke), a böngészőben vár a visszatérésig.
 */
const key = (userKey: string) => userStorageKey('checkoutReturn', userKey)

export function rememberCheckoutReturn(userKey: string, path: string | undefined): void {
  const safe = localPath(path)
  if (safe === undefined) removeStored(key(userKey))
  else writeStored(key(userKey), safe)
}

export function readCheckoutReturn(userKey: string): string | undefined {
  return localPath(readStored(key(userKey)))
}

export function clearCheckoutReturn(userKey: string): void {
  removeStored(key(userKey))
}
