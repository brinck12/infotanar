import { Link } from 'react-router-dom'
import { LockIcon } from '../../../shared/ui/LockIcon'
import type { TaskLink, TaskNavigation } from '../../../types'

/**
 * Lépkedés az előző és a következő feladatra a tanulási sorrendben (#145), hogy
 * ne kelljen visszamenni a listához. A piszkozat megmarad, így a váltás biztonságos.
 */
export function TaskStepper({ navigation }: { navigation: TaskNavigation }) {
  if (!navigation.previous && !navigation.next) return null

  return (
    <nav aria-label="Lépkedés a feladatok között" className="grid grid-cols-2 gap-2">
      {/* Üres hely tartja a „Következő” gombot a helyén, ha nincs előző feladat. */}
      {navigation.previous ? <StepLink target={navigation.previous} direction="previous" /> : <span />}
      {navigation.next && <StepLink target={navigation.next} direction="next" />}
    </nav>
  )
}

function StepLink({ target, direction }: { target: TaskLink; direction: 'previous' | 'next' }) {
  const previous = direction === 'previous'

  return (
    <Link
      to={`/feladatok/${target.id}`}
      // A cím egérrel buboréksúgóként, képernyőolvasóval a névben jelenik meg.
      title={target.title}
      aria-label={`${previous ? 'Előző' : 'Következő'} feladat: ${target.title}${target.locked ? ' (zárolt)' : ''}`}
      data-testid={`task-step-${direction}`}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 transition hover:border-sky-700 hover:text-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      {previous && <span aria-hidden="true">←</span>}
      {target.locked && <LockIcon className="h-3.5 w-3.5 text-amber-300" />}
      {previous ? 'Előző' : 'Következő'}
      {!previous && <span aria-hidden="true">→</span>}
    </Link>
  )
}
