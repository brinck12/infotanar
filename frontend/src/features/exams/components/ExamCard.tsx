import type { ReactNode } from 'react'
import type { ExamPart } from '../../../shared/domain/exam'
import { LevelBadge } from '../../../shared/ui/Badge'
import { Icon } from '../../../shared/ui/Icon'
import { Panel } from '../../../shared/ui/Panel'
import type { Level } from '../../../types'

interface ExamCardProps {
  title: string
  level: Level
  minutes: number
  points: number
  parts: ReadonlyArray<Pick<ExamPart, 'key' | 'name' | 'points' | 'icon'>>
  /** Az állapot sora a vonal alatt, pl. „Kész: 81 / 100 pont”. */
  status: ReactNode
  /** Egyetlen fő művelet (és legfeljebb mellékes hivatkozások). */
  action: ReactNode
}

/** Vizsgakártya: időszak és szint, perc és pont, a részek, állapot és egy művelet. */
export function ExamCard({ title, level, minutes, points, parts, status, action }: ExamCardProps) {
  return (
    <Panel as="li" className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-22 leading-snug font-semibold">{title}</h3>
        <LevelBadge level={level} />
      </div>
      <p className="mt-1 text-15 text-ink-soft">
        {minutes} perc, {points} pont
      </p>
      <ul className="mt-3 flex flex-col gap-1.5">
        {parts.map((part) => (
          <li key={part.key} className="flex items-center gap-2 text-15">
            <Icon name={part.icon} size={16} className="text-ink-soft" />
            <span className="min-w-0 flex-1">{part.name}</span>
            <span className="text-14 whitespace-nowrap text-ink-soft">{part.points} pont</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-4">
        <p className="border-t border-grid pt-3.5 text-15 font-semibold">{status}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">{action}</div>
      </div>
    </Panel>
  )
}
