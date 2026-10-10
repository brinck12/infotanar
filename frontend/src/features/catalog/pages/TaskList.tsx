import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { readLastTask, userKeyOf } from '../../../shared/domain/lastTask'
import { Banner } from '../../../shared/ui/Banner'
import { ButtonLink } from '../../../shared/ui/Button'
import { FilterChips, type FilterOption } from '../../../shared/ui/FilterChips'
import { Panel } from '../../../shared/ui/Panel'
import { CardSkeleton, EmptyState, LoadError } from '../../../shared/ui/States'
import { TaskCard } from '../../../shared/ui/TaskCard'
import { Lead, PageTitle, SectionTitle } from '../../../shared/ui/Text'
import type { ExerciseStatus, Level, TaskListItem } from '../../../types'
import { useAuth } from '../../auth/context'
import { tasksQuery } from '../api'
import { useCatalogTree, type CatalogTree } from '../useCatalogTree'

type LevelFilter = Level | ''
type StatusFilter = '' | 'todo' | 'done'

const LEVELS: ReadonlyArray<FilterOption<LevelFilter>> = [
  { value: '', label: 'Mind' },
  { value: 'kozep', label: 'Középszint' },
  { value: 'emelt', label: 'Emelt szint' },
]

const STATUSES: ReadonlyArray<FilterOption<StatusFilter>> = [
  { value: '', label: 'Mind' },
  { value: 'todo', label: 'Még nincs megoldva' },
  { value: 'done', label: 'Megoldva' },
]

function isLevel(value: string): value is Level {
  return value === 'kozep' || value === 'emelt'
}

interface TaskGroup {
  key: string
  title: string
  tasks: TaskListItem[]
}

/** Képzési áganként csoportosít; amíg a katalógus szerkezete nem ismert, témakörönként. */
function groupTasks(tasks: TaskListItem[], tree: CatalogTree | null): TaskGroup[] {
  const groups = new Map<string, TaskGroup>()

  for (const task of tasks) {
    const track = tree?.exercises.get(task.id)?.place.track
    const key = track ? `sav:${track.slug}` : `tema:${task.topic.slug}`
    const group = groups.get(key) ?? { key, title: track?.title ?? task.topic.name, tasks: [] }
    group.tasks.push(task)
    groups.set(key, group)
  }

  // Az ágak a katalógus sorrendjében, a többi a beérkezés sorrendjében.
  const order = new Map((tree?.tracks ?? []).map((track, index) => [`sav:${track.slug}`, index]))
  return [...groups.values()].sort((a, b) => (order.get(a.key) ?? order.size) - (order.get(b.key) ?? order.size))
}

export function TaskList() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const topic = searchParams.get('temakor') ?? ''
  const track = searchParams.get('sav') ?? ''
  const levelParam = searchParams.get('szint') ?? ''
  const level: LevelFilter = isLevel(levelParam) ? levelParam : ''
  const statusParam = searchParams.get('allapot')
  const status: StatusFilter = statusParam === 'todo' || statusParam === 'done' ? statusParam : ''

  const tasks = useQuery(tasksQuery({ topic: topic || undefined, level: level || undefined }))
  // A katalógus szerkezetének hiánya nem blokkolja a feladatok megjelenítését.
  const { tree } = useCatalogTree()
  const lastTask = readLastTask(userKeyOf(user))

  function updateFilter(key: 'sav' | 'szint' | 'allapot', value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    // Másik ág választásakor a témakör-szűrő (a morzsamenüből) már nem érvényes.
    if (key === 'sav') next.delete('temakor')
    setSearchParams(next)
  }

  /** A néző saját állapota a feladatnál (#146); vendégnél a szerver nem küldi, ott nem ismert. */
  function statusOf(task: TaskListItem): ExerciseStatus | null | undefined {
    return user ? (task.my_status ?? null) : undefined
  }

  const trackOptions: Array<FilterOption<string>> = [
    { value: '', label: 'Mind' },
    ...(tree?.tracks ?? []).map((item) => ({ value: item.slug, label: item.title })),
  ]

  const visible = (tasks.data ?? []).filter((task) => {
    if (track && tree?.exercises.get(task.id)?.place.track.slug !== track) return false
    if (status === 'done') return statusOf(task) === 'solved'
    if (status === 'todo') return statusOf(task) !== 'solved'
    return true
  })
  const groups = groupTasks(visible, tree)
  const hasLocked = visible.some((task) => task.locked)

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <PageTitle>Feladatok</PageTitle>
      <Lead className="mt-3 max-w-prose text-18">Válassz egy témát, és kezdd el az első olyan feladattal, ami még nincs kész.</Lead>

      {lastTask && (
        <Panel kind="highlight" className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4" data-testid="continue-task">
          <div className="min-w-0 flex-1 basis-80">
            <p className="text-15 text-ink-soft">Itt tartottál legutóbb</p>
            <p className="mt-1 font-serif text-24 leading-snug font-semibold">{lastTask.title}</p>
            <p className="mt-1.5 text-15 text-ink-soft">{lastTask.topic}</p>
          </div>
          <ButtonLink to={`/feladatok/${lastTask.id}`} size="lg">
            Folytatás
          </ButtonLink>
        </Panel>
      )}

      <div className="mt-10 flex flex-col gap-3">
        {trackOptions.length > 2 && (
          <FilterChips label="Téma" options={trackOptions} value={track} onChange={(value) => updateFilter('sav', value)} />
        )}
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          <FilterChips label="Szint" options={LEVELS} value={level} onChange={(value) => updateFilter('szint', value)} />
          {user && (
            <FilterChips label="Állapot" options={STATUSES} value={status} onChange={(value) => updateFilter('allapot', value)} />
          )}
        </div>
      </div>

      <div className="mt-12">
        {tasks.isPending && <CardSkeleton count={6} label="Feladatok betöltése…" />}

        {tasks.isError && (
          <div data-testid="task-list-error">
            <LoadError error={tasks.error} onRetry={() => void tasks.refetch()} title="Nem sikerült betölteni a feladatokat" />
          </div>
        )}

        {tasks.isSuccess && visible.length === 0 && (
          <EmptyState
            title="Nincs a szűrésnek megfelelő feladat"
            action={
              <ButtonLink to="/feladatok" variant="secondary">
                Szűrők törlése
              </ButtonLink>
            }
          >
            Válassz másik témát vagy szintet.
          </EmptyState>
        )}

        <div className="flex flex-col gap-12">
          {groups.map((group) => {
            const done = group.tasks.filter((task) => statusOf(task) === 'solved').length
            return (
              <section key={group.key} aria-labelledby={`csoport-${group.key}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <SectionTitle id={`csoport-${group.key}`}>{group.title}</SectionTitle>
                  {user && (
                    <span className="text-15 text-ink-soft">
                      {done} / {group.tasks.length} megoldva
                    </span>
                  )}
                </div>
                <ul className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {group.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} status={statusOf(task)} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>

        {hasLocked && (
          <Banner
            kind="info"
            className="mt-12"
            action={
              <ButtonLink to="/elofizetes" variant="secondary">
                Prémium előfizetés
              </ButtonLink>
            }
          >
            A zárolt feladatokhoz Prémium előfizetés kell. Bármikor lemondható.
          </Banner>
        )}
      </div>
    </main>
  )
}
