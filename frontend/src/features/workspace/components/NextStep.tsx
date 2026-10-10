import { Banner } from '../../../shared/ui/Banner'
import { ButtonLink } from '../../../shared/ui/Button'
import type { UnlockedTaskDetail } from '../../../types'
import { lessonPath } from '../../lesson/api'

interface Step {
  label: string
  title: string
  to: string
  locked: boolean
}

/**
 * Hová érdemes továbblépni egy megoldott feladatról: a lecke következő
 * feladatára, ha nincs több, a következő leckére. Az ág végén nincs lépés.
 */
function nextStep(task: UnlockedTaskDetail): Step | null {
  const next = task.navigation?.next
  const nextLesson = task.navigation?.next_lesson

  if (next && next.lesson_id === task.lesson?.id) {
    return { label: 'Következő feladat', title: next.title, to: `/feladatok/${next.id}`, locked: next.locked }
  }

  if (nextLesson && task.lesson?.track_slug) {
    return {
      label: 'Következő lecke',
      title: nextLesson.title,
      to: lessonPath(task.lesson.track_slug, nextLesson.slug),
      locked: nextLesson.locked,
    }
  }

  return null
}

/**
 * Elfogadott beadás után (#145): megerősítés és a következő lépés, hogy a
 * tanulás ne akadjon meg az eredménynél. Zárolt célnál a link a paywallhoz visz.
 */
export function NextStep({ task, lessonCompleted }: { task: UnlockedTaskDetail; lessonCompleted: boolean }) {
  const step = nextStep(task)
  const trackSlug = task.lesson?.track_slug

  return (
    <Banner
      kind="success"
      data-testid="next-step"
      title={lessonCompleted && task.lesson ? `Lecke teljesítve: ${task.lesson.title}` : 'Feladat megoldva'}
      action={
        step ? (
          <ButtonLink to={step.to} icon={step.locked ? 'lock' : undefined}>
            {step.label}: {step.title}
            {step.locked && <span className="sr-only"> (zárolt)</span>}
          </ButtonLink>
        ) : (
          trackSlug && (
            <ButtonLink to={`/tanulasi-ut/${encodeURIComponent(trackSlug)}`} variant="secondary">
              Vissza a tanulási úthoz
            </ButtonLink>
          )
        )
      }
    >
      {step ? 'Minden teszten átment. Folytasd a következővel, amíg lendületben vagy.' : 'Ez volt a sáv utolsó leckéje.'}
    </Banner>
  )
}
