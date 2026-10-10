import { ButtonLink } from '../../../shared/ui/Button'
import { Icon } from '../../../shared/ui/Icon'
import type { TaskLink, TaskNavigation } from '../../../types'

/**
 * Lépkedés az előző és a következő feladatra a tanulási sorrendben (#145), hogy
 * ne kelljen visszamenni a listához. A piszkozat megmarad, így a váltás biztonságos.
 */
export function TaskStepper({ navigation }: { navigation: TaskNavigation }) {
  if (!navigation.previous && !navigation.next) return null

  return (
    <nav aria-label="Lépkedés a feladatok között" className="flex flex-wrap gap-3">
      {navigation.previous && <StepLink target={navigation.previous} direction="previous" />}
      {navigation.next && <StepLink target={navigation.next} direction="next" />}
    </nav>
  )
}

function StepLink({ target, direction }: { target: TaskLink; direction: 'previous' | 'next' }) {
  const previous = direction === 'previous'

  return (
    <ButtonLink
      to={`/feladatok/${target.id}`}
      variant="secondary"
      // A cím egérrel buboréksúgóként, képernyőolvasóval a névben jelenik meg.
      title={target.title}
      aria-label={`${previous ? 'Előző' : 'Következő'} feladat: ${target.title}${target.locked ? ' (zárolt)' : ''}`}
      data-testid={`task-step-${direction}`}
    >
      {previous && <Icon name="chevron-left" size={18} />}
      {target.locked && <Icon name="lock" size={18} />}
      {previous ? 'Előző feladat' : 'Következő feladat'}
      {!previous && <Icon name="chevron-right" size={18} />}
    </ButtonLink>
  )
}
