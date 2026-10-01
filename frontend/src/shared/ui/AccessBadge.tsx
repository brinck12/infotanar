import { LockIcon } from './LockIcon'

/**
 * Ingyenes / prémium / zárolt jelölés feladaton és leckén. Szöveg + ikon, nem
 * csak szín: színtévesztők és képernyőolvasók számára is egyértelmű.
 */
export function AccessBadge({ free, locked }: { free: boolean; locked: boolean }) {
  if (free) {
    return <span className="whitespace-nowrap rounded bg-emerald-950 px-2 py-0.5 text-xs text-emerald-300">Ingyenes</span>
  }

  return (
    <span
      data-testid="task-card-premium"
      data-locked={locked}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-amber-950 px-2 py-0.5 text-xs text-amber-300"
    >
      {locked && <LockIcon className="h-3 w-3" />}
      {locked ? 'Előfizetés szükséges' : 'Prémium'}
    </span>
  )
}
