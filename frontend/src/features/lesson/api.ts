import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../shared/api/client'
import type { LessonDetail } from '../../types'
import { catalogKeys } from '../catalog/api'

/**
 * Egy lecke oldala. A kulcs a képzési ág kulcsa alatt van, így egy beadás után
 * (ami a megoldott feladatokat változtatja) az ággal együtt frissül.
 */
export const lessonQuery = (trackSlug: string, lessonSlug: string) =>
  queryOptions({
    queryKey: [...catalogKeys.track(trackSlug), 'lesson', lessonSlug] as const,
    queryFn: async ({ signal }) =>
      (
        await http.get<Envelope<LessonDetail>>(
          `/tracks/${encodeURIComponent(trackSlug)}/lessons/${encodeURIComponent(lessonSlug)}`,
          { signal },
        )
      ).data.data,
  })

export function lessonPath(trackSlug: string, lessonSlug: string): string {
  return `/tananyag/${trackSlug}/${lessonSlug}`
}
