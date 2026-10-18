import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PRACTICE_TRACK } from '../../../shared/domain/exam'
import { Badge, LevelBadge } from '../../../shared/ui/Badge'
import { CardSkeleton, EmptyState, LoadError } from '../../../shared/ui/States'
import { CardTitle, SectionTitle } from '../../../shared/ui/Text'
import type { Level, LessonSummary, ModuleSummary } from '../../../types'
import { trackQuery } from '../../catalog/api'

/** A szakasz szintje a nevéből: a „közép” és az „emelt” szakasz egy-egy szintre való, a többi (pl. hibalista) mindkettőre. */
function levelOf(module: ModuleSummary): Level | null {
  if (module.slug.includes('kozep')) return 'kozep'
  if (module.slug.includes('emelt')) return 'emelt'
  return null
}

function progressText(lesson: LessonSummary): string | null {
  if (lesson.status === 'completed') return 'Kész'
  if (lesson.status === 'in_progress') return 'Folyamatban'
  return lesson.status === null ? null : 'Még nem kezdted el'
}

/**
 * Az érettségi-gyakorlás feladatsorai: a tanulási út leckéi, szakaszonként (közép, emelt, hibalista).
 * Egy feladatsor egy lecke, a feladatai a vizsga részfeladatainak felelnek meg.
 */
export function PracticeSets({ level }: { level: Level | '' }) {
  const track = useQuery(trackQuery(PRACTICE_TRACK))

  if (track.isPending) return <CardSkeleton count={3} label="Feladatsorok betöltése…" />
  if (track.isError) return <LoadError error={track.error} onRetry={() => void track.refetch()} title="Nem sikerült betölteni a feladatsorokat" />

  const modules = track.data.modules
    .filter((module) => module.lessons.length > 0)
    .filter((module) => !level || levelOf(module) === null || levelOf(module) === level)

  if (modules.length === 0) return <EmptyState title="Ezen a szinten még nincs feladatsor">Válassz másik szintet.</EmptyState>

  return (
    <div className="flex flex-col gap-12">
      {modules.map((module) => {
        const moduleLevel = levelOf(module)
        return (
          <section key={module.id} aria-labelledby={`feladatsorok-${module.id}`}>
            <SectionTitle id={`feladatsorok-${module.id}`}>{module.title}</SectionTitle>
            {module.description && <p className="mt-2 max-w-prose text-16 leading-relaxed text-ink-soft">{module.description}</p>}
            <ul className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {module.lessons.map((lesson) => {
                const status = progressText(lesson)
                return (
                  <li key={lesson.id} className="flex">
                    <Link
                      to={`/tanulasi-ut/${PRACTICE_TRACK}/${lesson.slug}`}
                      className="flex flex-1 flex-col gap-3 rounded-md border border-line bg-sheet p-6 text-ink no-underline hover:bg-faint hover:text-ink"
                    >
                      <span className="flex flex-wrap gap-2">
                        {moduleLevel && <LevelBadge level={moduleLevel} />}
                        {lesson.is_free ? <Badge kind="free">Ingyenes</Badge> : <Badge kind="prem">Prémium</Badge>}
                      </span>
                      <CardTitle>{lesson.title}</CardTitle>
                      <span className="text-15 text-ink-soft">{lesson.exercise_count > 0 ? `${lesson.exercise_count} feladat` : 'Szöveges lecke'}</span>
                      {status && <span className="mt-auto border-t border-grid pt-3 text-15 font-semibold text-ink-soft">{status}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
