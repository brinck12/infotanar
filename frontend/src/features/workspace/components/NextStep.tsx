import { Link } from 'react-router-dom'
import { LockIcon } from '../../../shared/ui/LockIcon'
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
    <div
      role="status"
      data-testid="next-step"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg border border-emerald-800 bg-emerald-950/50 p-4"
    >
      <div className="text-emerald-100">
        <p className="font-semibold">
          {lessonCompleted && task.lesson ? `Lecke teljesítve: ${task.lesson.title}` : 'Feladat megoldva'}
        </p>
        {!step && <p className="mt-1 text-sm text-emerald-200">Ez volt a képzési ág utolsó leckéje.</p>}
      </div>

      {step ? (
        <Link
          to={step.to}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          {step.locked && <LockIcon className="h-4 w-4" />}
          {step.label}: {step.title}
          {step.locked && <span className="sr-only"> (zárolt)</span>}
        </Link>
      ) : (
        trackSlug && (
          <Link
            to={`/tananyag/${trackSlug}`}
            className="rounded-sm text-sm text-sky-300 underline underline-offset-2 hover:text-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            Vissza a tananyaghoz
          </Link>
        )
      )}
    </div>
  )
}
