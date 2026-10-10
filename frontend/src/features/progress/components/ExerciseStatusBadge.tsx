import { Badge } from '../../../shared/ui/Badge'
import type { ExerciseStatus } from '../../../types'

const LABEL: Readonly<Record<ExerciseStatus, string>> = {
  solved: 'Megoldva',
  attempted: 'Megpróbáltad',
}

/**
 * A néző saját állapota egy feladatnál (#146): a szöveg mondja meg, nem csak a szín.
 * Amihez még nem nyúlt, annál nincs jelvény.
 */
export function ExerciseStatusBadge({ status }: { status: ExerciseStatus }) {
  return (
    <span data-testid="exercise-status" data-status={status} className="inline-flex">
      <Badge kind={status === 'solved' ? 'ok' : 'neutral'}>{LABEL[status]}</Badge>
    </span>
  )
}
