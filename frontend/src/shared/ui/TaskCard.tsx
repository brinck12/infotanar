import { Link } from 'react-router-dom'
import type { ExerciseStatus, LanguageKey, Level } from '../../types'
import { LANGUAGE_LABEL } from '../domain/labels'
import { Badge, LevelBadge } from './Badge'
import { cx } from './cx'
import { Icon, StateIcon } from './Icon'
import { Difficulty } from './Progress'

export interface TaskCardData {
  id: number
  title: string
  level: Level
  difficulty: number
  allowed_languages: LanguageKey[]
  is_free?: boolean
  locked?: boolean
}

const STATUS_LINE: Readonly<Record<ExerciseStatus | 'none', { text: string; className: string }>> = {
  solved: { text: 'Megoldva', className: 'text-accent' },
  attempted: { text: 'Megpróbáltad, még nincs kész', className: 'text-ink' },
  none: { text: 'Még nem kezdted el', className: 'text-ink-soft' },
}

interface TaskCardProps {
  task: TaskCardData
  /** A tanuló állapota a feladatnál (#146): `null`, ha még nem adott be; bejelentkezés nélkül nem ismert. */
  status?: ExerciseStatus | null
}

/** Feladatkártya: minden állapotban ugyanaz az elrendezés, csak az alsó sor változik. */
export function TaskCard({ task, status }: TaskCardProps) {
  const locked = task.locked ?? false
  const line = locked ? { text: 'Prémium kell hozzá', className: 'text-ink-soft' } : status === undefined ? null : STATUS_LINE[status ?? 'none']

  return (
    <li className="flex">
      <Link
        to={`/feladatok/${task.id}`}
        data-testid="task-card"
        className={cx(
          'flex flex-1 flex-col gap-3.5 rounded-md border border-line px-6 py-5 text-ink no-underline hover:bg-faint hover:text-ink',
          locked ? 'bg-faint' : 'bg-sheet',
        )}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="font-serif text-22 leading-snug font-semibold">{task.title}</span>
          {locked ? (
            <Icon name="lock" className="mt-1 text-ink-soft" label="Zárolt" />
          ) : (
            status === 'solved' && <StateIcon kind="ok" label="Megoldva" />
          )}
        </span>
        <span className="flex flex-wrap gap-2">
          <LevelBadge level={task.level} />
          {task.allowed_languages.map((language) => (
            <Badge key={language} kind="lang">
              {LANGUAGE_LABEL[language]}
            </Badge>
          ))}
          {task.is_free === true && <Badge kind="free">Ingyenes</Badge>}
          {task.is_free === false && !locked && (
            <span data-testid="task-card-premium" data-locked={false}>
              <Badge kind="prem">Prémium</Badge>
            </span>
          )}
        </span>
        <Difficulty value={task.difficulty} />
        {line && (
          <span
            {...(locked ? { 'data-testid': 'task-card-premium', 'data-locked': true } : { 'data-testid': 'exercise-status', 'data-status': status ?? 'none' })}
            className={cx('mt-auto border-t border-grid pt-3.5 text-15 font-semibold', line.className)}
          >
            {line.text}
          </span>
        )}
      </Link>
    </li>
  )
}
