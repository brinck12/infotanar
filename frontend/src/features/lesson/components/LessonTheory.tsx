import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useState } from 'react'
import { hibaUzenet } from '../../../shared/api/errors'
import type { LessonDetail } from '../../../types'
import { lessonQuery } from '../api'
import { LessonContent } from './LessonContent'

/**
 * A lecke tananyaga a munkaterületen, lenyitható blokkban: kódolás közben is
 * kéznél van az elmélet. A tartalmat csak az első lenyitáskor töltjük le.
 */
export function LessonTheory({ trackSlug, lessonSlug }: { trackSlug: string; lessonSlug: string }) {
  const [opened, setOpened] = useState(false)
  const lesson = useQuery({ ...lessonQuery(trackSlug, lessonSlug), enabled: opened })

  return (
    <details
      data-testid="lesson-theory"
      onToggle={(event) => {
        if (event.currentTarget.open) setOpened(true)
      }}
      className="rounded-lg border border-slate-800 bg-slate-900"
    >
      <summary className="cursor-pointer rounded-lg px-5 py-3 text-sm font-semibold text-slate-200 hover:text-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
        Tananyag a leckéhez
      </summary>
      <div className="border-t border-slate-800 p-5">
        <TheoryBody lesson={lesson} />
      </div>
    </details>
  )
}

function TheoryBody({ lesson }: { lesson: UseQueryResult<LessonDetail> }) {
  if (lesson.isError) return <p className="text-sm text-red-300">{hibaUzenet(lesson.error)}</p>
  if (!lesson.data) return <p className="text-sm text-slate-400">Tananyag betöltése…</p>
  if (lesson.data.locked) return <p className="text-sm text-slate-300">{lesson.data.locked_message}</p>
  if (lesson.data.content.trim() === '') {
    return <p className="text-sm text-slate-400">Ehhez a leckéhez még nincs írott tananyag.</p>
  }

  return <LessonContent>{lesson.data.content}</LessonContent>
}
