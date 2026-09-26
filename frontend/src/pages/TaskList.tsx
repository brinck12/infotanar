import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getTasks, getTopics, hibaUzenet } from '../api/client'
import { TaskCard } from '../components/TaskCard'
import type { TaskListItem, Topic } from '../types'

const LEVELS = [
  { value: '', label: 'Mindkét szint' },
  { value: 'kozep', label: 'Középszint' },
  { value: 'emelt', label: 'Emelt szint' },
]

/** A betöltött találatok, azzal a szűréssel együtt, amihez tartoznak. */
interface LoadedTasks {
  key: string
  tasks: TaskListItem[]
  error: string | null
}

export function TaskList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loaded, setLoaded] = useState<LoadedTasks | null>(null)

  const topic = searchParams.get('temakor') ?? ''
  const level = searchParams.get('szint') ?? ''
  const filterKey = `${topic}|${level}`

  // A "töltés alatt" állapotot nem külön state tárolja, hanem abból
  // következik, hogy a betöltött adat a jelenlegi szűréshez tartozik-e.
  const loading = loaded?.key !== filterKey

  useEffect(() => {
    getTopics()
      .then(setTopics)
      // A témakörlista hiánya nem blokkolja a feladatok megjelenítését.
      .catch(() => setTopics([]))
  }, [])

  useEffect(() => {
    let aborted = false

    getTasks({ topic: topic || undefined, level: level || undefined })
      .then((tasks) => {
        if (!aborted) setLoaded({ key: filterKey, tasks, error: null })
      })
      .catch((err) => {
        if (!aborted) setLoaded({ key: filterKey, tasks: [], error: hibaUzenet(err) })
      })

    return () => {
      aborted = true
    }
  }, [topic, level, filterKey])

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next)
  }

  const tasks = loaded?.tasks ?? []
  const error = loaded?.error ?? null

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
            {topics.map((t) => (
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
        {loading && <p className="text-slate-400">Feladatok betöltése…</p>}

        {!loading && error && (
          <p
            role="alert"
            data-testid="task-list-error"
            className="rounded-lg border border-red-900 bg-red-950/60 p-4 text-red-200"
          >
            {error}
          </p>
        )}

        {!loading && !error && tasks.length === 0 && (
          <p className="text-slate-400">Nincs a szűrésnek megfelelő feladat.</p>
        )}

        {!loading && !error && tasks.length > 0 && (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
