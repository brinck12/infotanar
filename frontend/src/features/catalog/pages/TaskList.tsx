import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import type { Level } from '../../../types'
import { useAuth } from '../../auth/context'
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

/** Az „csak a megoldatlanok” szűrő értéke az URL-ben (`?allapot=megoldatlan`). */
const UNSOLVED = 'megoldatlan'

export function TaskList() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const topic = searchParams.get('temakor') ?? ''
  const levelParam = searchParams.get('szint') ?? ''
  const level = isLevel(levelParam) ? levelParam : ''
  // Vendégnek nincs állapota: nála a szűrő nem látszik és nem is szűr.
  const onlyUnsolved = user !== null && searchParams.get('allapot') === UNSOLVED

  // A témakörlista hiánya nem blokkolja a feladatok megjelenítését.
  const topics = useQuery(topicsQuery())
  const tasks = useQuery(
    tasksQuery({ topic: topic || undefined, level: level || undefined, status: onlyUnsolved ? 'unsolved' : undefined }),
  )

  function updateFilter(key: 'temakor' | 'szint' | 'allapot', value: string) {
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

        {user && (
          // Kapcsológomb, nem jelölőnégyzet: az állapota az URL-ből jön, az pedig a kattintás
          // után egy pillanattal frissül, amit egy vezérelt jelölőnégyzet visszaugrással jelezne.
          <button
            type="button"
            aria-pressed={onlyUnsolved}
            onClick={() => updateFilter('allapot', onlyUnsolved ? '' : UNSOLVED)}
            className={`inline-flex items-center gap-2 self-end rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              onlyUnsolved
                ? 'border-sky-600 bg-sky-950 text-sky-100'
                : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-600'
            }`}
          >
            {/* A pipa a színen túl is jelzi a bekapcsolt állapotot. */}
            <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3.5 w-3.5 ${onlyUnsolved ? '' : 'invisible'}`}>
              <path d="m3.5 8.5 3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Csak a megoldatlanok
          </button>
        )}
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
