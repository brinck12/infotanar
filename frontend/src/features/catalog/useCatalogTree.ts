import { useQueries, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { ExerciseSummary, LessonSummary, ModuleSummary, TrackDetail } from '../../types'
import { trackQuery, tracksQuery } from './api'

export interface LessonPlace {
  track: TrackDetail
  module: ModuleSummary
  lesson: LessonSummary
  /** A lecke sorszáma a képzési ágon belül (1-től), a modulokon átívelve. */
  position: number
  previous: LessonSummary | null
  next: LessonSummary | null
}

export interface CatalogTree {
  tracks: TrackDetail[]
  /** Lecke azonosító → hol van a katalógusban. */
  lessons: Map<number, LessonPlace>
  /** Feladat azonosító → a leckéje és az ága. */
  exercises: Map<number, { exercise: ExerciseSummary; place: LessonPlace }>
}

function buildTree(tracks: TrackDetail[]): CatalogTree {
  const lessons = new Map<number, LessonPlace>()
  const exercises: CatalogTree['exercises'] = new Map()

  for (const track of tracks) {
    const ordered = track.modules.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson })))
    ordered.forEach(({ module, lesson }, index) => {
      const place: LessonPlace = {
        track,
        module,
        lesson,
        position: index + 1,
        previous: ordered[index - 1]?.lesson ?? null,
        next: ordered[index + 1]?.lesson ?? null,
      }
      lessons.set(lesson.id, place)
      for (const exercise of lesson.exercises) exercises.set(exercise.id, { exercise, place })
    })
  }

  return { tracks, lessons, exercises }
}

/**
 * A teljes közzétett katalógus (ág → modul → lecke → feladat) egyben. Nincs
 * külön lecke-végpont, ezért a leckeoldal és a tanulási út is ebből dolgozik;
 * az ágak ritkán változnak, a válaszok öt percig frissnek számítanak.
 */
export function useCatalogTree() {
  const tracks = useQuery(tracksQuery())
  const details = useQueries({
    queries: (tracks.data ?? []).map((track) => trackQuery(track.slug)),
  })

  const loaded = tracks.isSuccess && details.every((detail) => detail.isSuccess)
  const error = tracks.error ?? details.find((detail) => detail.isError)?.error ?? null
  // A lekérdezések adatai stabil hivatkozások: a kulcs csak akkor változik, ha új adat jött.
  const stamp = details.map((detail) => detail.dataUpdatedAt).join(',')

  const tree = useMemo(
    () => (loaded ? buildTree(details.flatMap((detail) => (detail.data ? [detail.data] : []))) : null),
    // oxlint-disable-next-line react/exhaustive-deps -- a `details` tömb minden renderkor új; a `stamp` követi a tartalmát
    [loaded, stamp],
  )

  return {
    tree,
    summaries: tracks.data ?? null,
    isPending: !loaded && !error,
    error,
    refetch: () => {
      void tracks.refetch()
      details.forEach((detail) => void detail.refetch())
    },
  }
}
