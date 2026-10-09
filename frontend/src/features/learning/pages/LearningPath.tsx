import { useId } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { trackIcon } from '../../../shared/domain/exam'
import { Badge } from '../../../shared/ui/Badge'
import { ButtonLink } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { Icon, StateIcon } from '../../../shared/ui/Icon'
import { Panel } from '../../../shared/ui/Panel'
import { EmptyState, LoadError, Skeleton } from '../../../shared/ui/States'
import { TabPanel, Tabs } from '../../../shared/ui/Tabs'
import { CardTitle, Lead, PageTitle, SectionTitle } from '../../../shared/ui/Text'
import type { LessonProgressStatus, ModuleSummary, TrackDetail } from '../../../types'
import { useCatalogTree } from '../../catalog/useCatalogTree'
import { useLessonStatuses } from '../../progress/useLessonStatuses'
import { PointsBar } from '../components/PointsBar'

/** A 2024 májusa és 2026 májusa közötti tíz programozási feladat elemzéséből (FRONTEND.md 13.). */
const PROGRAMMING_FACTS = [
  'Minden feladatban sorszámozott kiírást kérnek („2. feladat”), és a bekért adat mellé ki kell írni, mit várunk.',
  'Középszinten az 5 feladatból 4-ben a számok a forráskódban vannak, emelt szinten mind az 5-ben fájlból jönnek az adatok.',
  'Emelt szinten az 5 feladatból 4-ben fájlt vagy HTML-táblázatot is létre kell hozni.',
  'Mindegyik feladat kimondja, hogy a bemenet helyességét nem kell ellenőrizni, ezért hibakezelés nem kellett.',
  'Rendezést egyik feladat sem kért. Gyakori viszont a legnagyobb vagy legkisebb érték megkeresése a helyével együtt.',
  'A részpontok lépésenként járnak, a hibás vagy félkész program is kaphat pontot.',
]

type StageState = 'done' | 'current' | 'open' | 'premium'

function stageState(module: ModuleSummary, statuses: Map<number, LessonProgressStatus> | null, isCurrent: boolean): StageState {
  if (statuses && module.lessons.length > 0 && module.lessons.every((lesson) => statuses.get(lesson.id) === 'completed')) return 'done'
  if (isCurrent) return 'current'
  return module.lessons.some((lesson) => lesson.is_free) || module.lessons.length === 0 ? 'open' : 'premium'
}

/** Tanulási út: a pontok megoszlása, majd sávonként a szakaszok az alapoktól a feladatsorokig. */
export function LearningPath() {
  const { tree, isPending, error, refetch } = useCatalogTree()
  const statuses = useLessonStatuses()
  const [params, setParams] = useSearchParams()
  const tabsId = useId()

  const tracks = tree?.tracks ?? []
  const active = tracks.find((track) => track.slug === params.get('sav')) ?? tracks[0]

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <PageTitle>Az alapoktól az érettségi feladatsorig</PageTitle>
      <Lead className="mt-3 max-w-prose text-18">
        Az érettségi nem csak programozás. Itt minden résznek van saját útja: először megtanulod, aztán gyakorolsz, a végén
        érettségi-jellegű feladatokat oldasz.
      </Lead>

      <div className="mt-10">
        <PointsBar />
      </div>

      <div className="mt-12">
        {error ? (
          <LoadError error={error} onRetry={refetch} title="Nem sikerült betölteni a tanulási utat" />
        ) : isPending ? (
          <Skeleton lines={6} label="Tanulási út betöltése…" />
        ) : !active ? (
          <EmptyState title="Még nincs közzétett tananyag">Amint megjelenik az első sáv, itt találod a szakaszait.</EmptyState>
        ) : (
          <>
            <Tabs
              label="Sávok"
              idPrefix={tabsId}
              tabs={tracks.map((track) => ({ id: track.slug, label: track.title }))}
              active={active.slug}
              onChange={(slug) => setParams({ sav: slug }, { replace: true })}
            />
            <TabPanel idPrefix={tabsId} id={active.slug} active className="mt-8">
              <TrackStages track={active} statuses={statuses} />
            </TabPanel>

            {tracks.length > 1 && (
              <section className="mt-18" aria-labelledby="tobbi-sav">
                <SectionTitle id="tobbi-sav">A többi sáv</SectionTitle>
                <p className="mt-2 max-w-prose text-16 leading-relaxed text-ink-soft">
                  Mindegyik ugyanígy épül fel, az alapoktól az érettségi-jellegű feladatokig. Mindegyikben az első két lecke ingyenes.
                </p>
                <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {tracks
                    .filter((track) => track.slug !== active.slug)
                    .map((track) => (
                      <li key={track.id} className="flex">
                        <Link
                          to={`/tanulasi-ut/${track.slug}`}
                          className="flex flex-1 flex-col gap-2 rounded-md border border-line bg-sheet p-6 text-ink no-underline hover:bg-faint hover:text-ink"
                        >
                          <span className="inline-flex size-10 items-center justify-center rounded-md bg-note">
                            <Icon name={trackIcon(track.slug)} size={22} />
                          </span>
                          <span className="font-serif text-22 leading-snug font-semibold">{track.title}</span>
                          <span className="text-14 font-semibold text-accent">
                            {track.modules.length} szakasz, {track.modules.reduce((sum, module) => sum + module.lessons.length, 0)} lecke
                          </span>
                          {track.description && <span className="text-16 leading-relaxed text-ink-soft">{track.description}</span>}
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function TrackStages({ track, statuses }: { track: TrackDetail; statuses: Map<number, LessonProgressStatus> | null }) {
  const stages = track.modules.filter((module) => module.lessons.length > 0)
  // Az első olyan szakasz, amelyik még nincs kész: itt tart a tanuló (vendégnél az első).
  const currentIndex = stages.findIndex((module) => !module.lessons.every((lesson) => statuses?.get(lesson.id) === 'completed'))
  const doneCount = statuses ? stages.filter((module) => module.lessons.every((lesson) => statuses.get(lesson.id) === 'completed')).length : 0
  const isProgramming = trackIcon(track.slug) === 'code'

  if (stages.length === 0) {
    return <EmptyState title="Ebben a sávban még nincs lecke">Hamarosan érkezik. Addig nézz körül a többi sávban.</EmptyState>
  }

  return (
    <div className="flex flex-wrap items-start gap-8">
      <ol className="min-w-0 flex-1 basis-140 overflow-hidden rounded-md border border-line bg-sheet">
        {stages.map((module, index) => (
          <Stage key={module.id} number={index + 1} module={module} state={stageState(module, statuses, index === currentIndex)} statuses={statuses} />
        ))}
      </ol>

      <aside className="flex w-full flex-col gap-6 md:w-80 md:flex-none">
        <Panel>
          <CardTitle as="h2">{track.title}</CardTitle>
          {track.description && <p className="mt-2 text-16 leading-relaxed text-ink-soft">{track.description}</p>}
          {statuses && (
            <p className="mt-3 text-16 font-semibold">
              {doneCount} / {stages.length} szakasz kész
            </p>
          )}
          <ButtonLink to={`/tanulasi-ut/${track.slug}`} variant="secondary" className="mt-4">
            A sáv minden leckéje
          </ButtonLink>
        </Panel>

        {isProgramming && (
          <Panel kind="note">
            <CardTitle as="h3">Mit kérnek a programozási feladatban?</CardTitle>
            <p className="mt-2 text-15 leading-relaxed text-ink-soft">
              A 2024 májusa és 2026 májusa közötti öt vizsgaidőszak mind a tíz feladatát megnéztük.
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {PROGRAMMING_FACTS.map((fact) => (
                <li key={fact} className="flex gap-2.5 text-15 leading-normal">
                  <Icon name="check" size={18} className="mt-0.5 text-accent" />
                  {fact}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <p className="text-15 leading-relaxed text-ink-soft">
          Szakaszról szakaszra haladsz, de bármelyik megnyitható: ha valamit már tudsz, ugorj a következőre.
        </p>
      </aside>
    </div>
  )
}

interface StageProps {
  number: number
  module: ModuleSummary
  state: StageState
  statuses: Map<number, LessonProgressStatus> | null
}

function Stage({ number, module, state, statuses }: StageProps) {
  const first = module.lessons[0]
  const nextLesson = module.lessons.find((lesson) => statuses?.get(lesson.id) !== 'completed') ?? first
  const muted = state === 'premium'

  return (
    <li className={cx('flex gap-4 border-t border-grid px-5 py-5 first:border-t-0 md:px-6', state === 'current' && 'bg-faint')}>
      <span
        className={cx(
          'inline-flex size-8 flex-none items-center justify-center rounded-sm text-15 font-bold',
          state === 'done' ? 'bg-accent text-sheet' : state === 'current' ? 'bg-ink text-sheet' : 'border border-muted text-ink-soft',
        )}
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h3 className={cx('font-serif text-20 leading-snug font-semibold', muted && 'text-ink-soft')}>{module.title}</h3>
          {state === 'done' && <Badge kind="ok">Kész</Badge>}
          {state === 'current' && statuses && <Badge kind="kozep">Itt tartasz</Badge>}
          {state === 'premium' && <Badge kind="prem">Prémium</Badge>}
        </div>
        {module.description && <p className="mt-1.5 max-w-prose text-16 leading-normal text-ink-soft">{module.description}</p>}

        {state === 'current' ? (
          <>
            <ul className="mt-3">
              {module.lessons.map((lesson) => (
                <li key={lesson.id} className="flex items-center gap-3 border-t border-grid py-0.5">
                  <StateIcon kind={statuses?.get(lesson.id) === 'completed' ? 'ok' : 'empty'} />
                  <Link to={`/leckek/${lesson.id}`} className="inline-flex min-h-11 flex-1 items-center text-16 text-ink">
                    {lesson.title}
                  </Link>
                  <span className="text-13 text-ink-soft">{lesson.exercises.length > 0 ? `${lesson.exercises.length} feladat` : 'Lecke'}</span>
                </li>
              ))}
            </ul>
            {nextLesson && (
              <ButtonLink to={`/leckek/${nextLesson.id}`} className="mt-3">
                {statuses ? 'Folytatás' : 'Kezdés'}
              </ButtonLink>
            )}
          </>
        ) : (
          first && (
            <Link to={`/leckek/${first.id}`} className="mt-1 inline-flex min-h-11 items-center text-15 font-semibold">
              {module.lessons.length} lecke megnyitása
            </Link>
          )
        )}
      </div>
    </li>
  )
}
