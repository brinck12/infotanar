import { Link } from 'react-router-dom'
import { LANGUAGE_LABEL, LEVEL_LABEL } from '../../../shared/domain/labels'
import { LockIcon } from '../../../shared/ui/LockIcon'
import type { TaskListItem } from '../../../types'

export function TaskCard({ task }: { task: TaskListItem }) {
  return (
    <li>
      <Link
        to={`/feladatok/${task.id}`}
        data-testid="task-card"
        className="block rounded-lg border border-slate-800 bg-slate-900 p-4 transition hover:border-sky-700 hover:bg-slate-900/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-medium text-slate-100">{task.title}</h3>
          <span
            className={[
              'rounded px-2 py-0.5 text-xs',
              task.level === 'emelt' ? 'bg-purple-950 text-purple-300' : 'bg-sky-950 text-sky-300',
            ].join(' ')}
          >
            {LEVEL_LABEL[task.level]}
          </span>
          {task.is_free !== undefined && <AccessBadge free={task.is_free} locked={task.locked ?? false} />}
        </div>

        <p className="mt-1 text-sm text-slate-400">{task.topic.name}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span aria-label={`Nehézség: ${task.difficulty} az 5-ből`}>
            Nehézség: <span className="text-slate-300">{'★'.repeat(task.difficulty)}</span>
            {'☆'.repeat(Math.max(0, 5 - task.difficulty))}
          </span>
          <span>{task.allowed_languages.map((l) => LANGUAGE_LABEL[l]).join(', ')}</span>
        </div>
      </Link>
    </li>
  )
}

/** Szöveg + ikon, nem csak szín: színtévesztők és képernyőolvasók számára is egyértelmű. */
function AccessBadge({ free, locked }: { free: boolean; locked: boolean }) {
  if (free) {
    return <span className="rounded bg-emerald-950 px-2 py-0.5 text-xs text-emerald-300">Ingyenes</span>
  }

  return (
    <span
      data-testid="task-card-premium"
      data-locked={locked}
      className="inline-flex items-center gap-1 rounded bg-amber-950 px-2 py-0.5 text-xs text-amber-300"
    >
      {locked && <LockIcon className="h-3 w-3" />}
      {locked ? 'Előfizetés szükséges' : 'Prémium'}
    </span>
  )
}
