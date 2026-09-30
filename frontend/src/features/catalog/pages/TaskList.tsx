import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import type { Level } from '../../../types'
import { tasksQuery, topicsQuery } from '../api'
import { TaskCard } from '../components/TaskCard'

const LEVELS: ReadonlyArray<{ value: Level | ''; label: string }> = [
  { value: '', label: 'Mindkét szint' },
  { value: 'kozep', label: 'Középszint' },
  { value: 'emelt', label: 'Emelt szint' },
]

function isLevel(value: string): value is Level {
  return value === 'kozep' || value === 'emelt'
}

export function TaskList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const topic = searchParams.get('temakor') ?? ''
  const levelParam = searchParams.get('szint') ?? ''
  const level = isLevel(levelParam) ? levelParam : ''

  // A témakörlista hiánya nem blokkolja a feladatok megjelenítését.
  const topics = useQuery(topicsQuery())
  const tasks = useQuery(tasksQuery({ topic: topic || undefined, level: level || undefined }))

  function updateFilter(key: 'temakor' | 'szint', value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-100">Feladatok</h1>

      <div className="mt-6 flex flex-wrap gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Témakör</span>
          <select
            value={topic}
            onChange={(e) => updateFilter('temakor', e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="">Összes témakör</option>
            {(topics.data ?? []).map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name} ({t.task_count})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Szint</span>
          <select
            value={level}
            onChange={(e) => updateFilter('szint', e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8">
        {tasks.isPending && <p className="text-slate-400">Feladatok betöltése…</p>}

        {tasks.isError && (
          <p
            role="alert"
            data-testid="task-list-error"
            className="rounded-lg border border-red-900 bg-red-950/60 p-4 text-red-200"
          >
            {hibaUzenet(tasks.error)}
          </p>
        )}

        {tasks.isSuccess && tasks.data.length === 0 && (
          <p className="text-slate-400">Nincs a szűrésnek megfelelő feladat.</p>
        )}

        {tasks.isSuccess && tasks.data.length > 0 && (
          <ul className="space-y-3">
            {tasks.data.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
