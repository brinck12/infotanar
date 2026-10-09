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

const key = (userKey: string) => `infotanar.lastTask.v1.${userKey}`

function isLastTask(value: unknown): value is LastTask {
  if (typeof value !== 'object' || value === null) return false
  const task = value as Partial<LastTask>
  return typeof task.id === 'number' && typeof task.title === 'string' && typeof task.topic === 'string' && typeof task.openedAt === 'number'
}

export function readLastTask(userKey: string): LastTask | null {
  try {
    const raw = localStorage.getItem(key(userKey))
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    return isLastTask(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function rememberLastTask(userKey: string, task: Omit<LastTask, 'openedAt'>): void {
  try {
    localStorage.setItem(key(userKey), JSON.stringify({ ...task, openedAt: Date.now() } satisfies LastTask))
  } catch {
    // Tiltott vagy teli tárhely: a sor egyszerűen nem jelenik meg.
  }
}

export function userKeyOf(user: { id: number } | null): string {
  return user ? `u${user.id}` : 'guest'
}
