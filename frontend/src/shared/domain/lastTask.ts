import { readStoredJson, writeStoredJson } from './localStore'
import { userStorageKey } from './userStorage'

/**
 * A legutóbb megnyitott feladat a böngészőben, felhasználónként: ebből lesz az
 * „Itt tartottál legutóbb” sor. Kényelmi adat, a szerver nem tud róla.
 */
export interface LastTask {
  id: number
  title: string
  topic: string
  openedAt: number
}

const key = (userKey: string) => userStorageKey('lastTask', userKey)

function isLastTask(value: unknown): value is LastTask {
  if (typeof value !== 'object' || value === null) return false
  const task = value as Partial<LastTask>
  return typeof task.id === 'number' && typeof task.title === 'string' && typeof task.topic === 'string' && typeof task.openedAt === 'number'
}

export function readLastTask(userKey: string): LastTask | null {
  return readStoredJson(key(userKey), isLastTask)
}

export function rememberLastTask(userKey: string, task: Omit<LastTask, 'openedAt'>): void {
  writeStoredJson(key(userKey), { ...task, openedAt: Date.now() } satisfies LastTask)
}
