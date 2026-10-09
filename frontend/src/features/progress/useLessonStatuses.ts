import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { LessonProgressStatus } from '../../types'
import { useAuth } from '../auth/context'
import { progressQuery } from './api'

/**
 * Lecke azonosító → állapot a bejelentkezett tanulónak. Vendégnél `null`:
 * ott nincs mit mutatni, és a haladás-végpontot sem hívjuk.
 */
export function useLessonStatuses(): Map<number, LessonProgressStatus> | null {
  const { user } = useAuth()
  const progress = useQuery({ ...progressQuery(), enabled: user !== null })

  return useMemo(() => {
    if (!user || !progress.data) return null
    return new Map(progress.data.tracks.flatMap((track) => track.lessons.map((lesson) => [lesson.id, lesson.status] as const)))
  }, [user, progress.data])
}
