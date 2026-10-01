import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hibaUzenet } from '../../../shared/api/errors'
import type { LessonDetail, UnlockedLessonDetail } from '../../../types'
import { catalogKeys } from '../../catalog/api'
import { progressKeys } from '../../progress/api'
import { completeLesson, lessonQuery } from '../api'

/**
 * Feladat nélküli lecke késznek jelölése (#144). Feladatos lecke a feladatai
 * megoldásával teljesül, vendégnek pedig nincs haladása: nekik nem jelenik meg.
 */
export function CompleteLesson({ lesson }: { lesson: UnlockedLessonDetail }) {
  const queryClient = useQueryClient()

  const complete = useMutation({
    mutationFn: () => completeLesson(lesson.id),
    onSuccess: () => {
      // Az állapot azonnal látszik; a haladás és a tananyag-nézet a háttérben frissül.
      queryClient.setQueryData<LessonDetail>(lessonQuery(lesson.track.slug, lesson.slug).queryKey, (current) =>
        current ? { ...current, status: 'completed' } : current,
      )
      void queryClient.invalidateQueries({ queryKey: progressKeys.all })
      void queryClient.invalidateQueries({ queryKey: catalogKeys.tracks() })
    },
  })

  if (lesson.exercises.length > 0 || lesson.status === null) return null

  return (
    // A státusz-régió végig a DOM-ban van, így a képernyőolvasó a változást bemondja.
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5" data-testid="complete-lesson">
      <p role="status" className="text-slate-300">
        {lesson.status === 'completed'
          ? 'Ezt a leckét késznek jelölted.'
          : 'Ehhez a leckéhez nincs feladat. Ha átnézted, jelöld késznek, hogy a haladásodban is megjelenjen.'}
      </p>

      {lesson.status !== 'completed' && (
        <button
          type="button"
          onClick={() => complete.mutate()}
          disabled={complete.isPending}
          className="mt-4 rounded-lg bg-sky-700 px-5 py-2.5 font-medium text-white transition hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60"
        >
          {complete.isPending ? 'Mentés…' : 'Megjelöltem késznek'}
        </button>
      )}

      {complete.isError && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {hibaUzenet(complete.error)}
        </p>
      )}
    </div>
  )
}
