import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hibaUzenet } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
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
      // Az állapot azonnal látszik; a haladás és a tanulási út a háttérben frissül.
      queryClient.setQueryData<LessonDetail>(lessonQuery(lesson.track.slug, lesson.slug).queryKey, (current) =>
        current ? { ...current, status: 'completed' } : current,
      )
      void queryClient.invalidateQueries({ queryKey: progressKeys.all })
      void queryClient.invalidateQueries({ queryKey: catalogKeys.tracks() })
    },
  })

  if (lesson.exercises.length > 0 || lesson.status === null) return null

  return (
    <Panel as="section" aria-label="A lecke lezárása" data-testid="complete-lesson">
      {/* A státusz-régió végig a DOM-ban van, így a képernyőolvasó a változást bemondja. */}
      <p role="status" className="text-16 leading-relaxed text-ink-soft">
        {lesson.status === 'completed'
          ? 'Ezt a leckét késznek jelölted.'
          : 'Ehhez a leckéhez nincs feladat. Ha átnézted, jelöld késznek, hogy a haladásodban is megjelenjen.'}
      </p>

      {lesson.status !== 'completed' && (
        <Button icon="check" busy={complete.isPending} busyLabel="Mentés…" onClick={() => complete.mutate()} className="mt-4">
          Megjelöltem késznek
        </Button>
      )}

      {complete.isError && (
        <Banner kind="error" className="mt-4">
          {hibaUzenet(complete.error)}
        </Banner>
      )}
    </Panel>
  )
}
