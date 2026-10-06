import { Link } from 'react-router-dom'
import { AccessBadge } from '../../../shared/ui/AccessBadge'
import type { LessonSummary } from '../../../types'
import { lessonPath } from '../../lesson/api'
import { LessonStatusBadge } from '../../progress/components/LessonStatusBadge'

/**
 * Egy lecke a képzési ág oldalán: cím, hozzáférés, tartalom-jelzők és (bejelentkezve)
 * az állapot. A sor a lecke oldalára visz; zárolt leckénél ott a paywall fogad.
 */
export function LessonRow({ trackSlug, lesson }: { trackSlug: string; lesson: LessonSummary }) {
  return (
    // Keskeny kijelzőn az állapot a cím alá kerül, hogy a címnek maradjon hely.
    <li
      className="flex flex-col items-start gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      data-testid="lesson-row"
    >
      <Link
        to={lessonPath(trackSlug, lesson.slug)}
        className="group min-w-0 flex-1 self-stretch rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-slate-100 group-hover:text-sky-300">{lesson.title}</span>
          <AccessBadge free={lesson.is_free} locked={lesson.locked} />
        </span>
        <span className="mt-1 block text-xs text-slate-400">
          {lesson.exercise_count === 0 ? 'Feladat nélkül' : `${lesson.exercise_count} feladat`}
          {lesson.has_video && ' · videós magyarázattal'}
        </span>
      </Link>
      {lesson.status && <LessonStatusBadge status={lesson.status} />}
    </li>
  )
}
