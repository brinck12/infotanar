import type { ReactNode } from 'react'
import type { Level } from '../../types'
import { LevelBadge } from './Badge'
import { Panel } from './Panel'
import { Prose } from './Prose'
import { RubricItem, type RubricState } from './RubricItem'
import { CardTitle } from './Text'

export interface BriefCheck {
  id: string | number
  state: RubricState
  text: ReactNode
  points: number
  maxPoints: number
  found?: string | null
  hint?: ReactNode
}

interface TaskBriefProps {
  task: { title: string; level: Level; description: string }
  /** A szint jelvény mellé kerülő további jelvények. */
  badges?: ReactNode
  /** A leírás alatt, az ellenőrzőlista előtt (pl. letölthető fájlok). */
  extras?: ReactNode
  checklistTitle: string
  score: ReactNode
  /** Az ellenőrzőlista címe alatti rövid útmutató. */
  note?: ReactNode
  checks: ReadonlyArray<BriefCheck>
  /** Az ellenőrzőlista után. */
  footer?: ReactNode
}

/** A böngészős gyakorlók bal oldali panelje: feladatleírás és élő ellenőrzőlista. */
export function TaskBrief({ task, badges, extras, checklistTitle, score, note, checks, footer }: TaskBriefProps) {
  return (
    <Panel as="section" pad="xl" aria-label="Feladat leírása" className="min-w-0 flex-1 basis-100 lg:max-w-form">
      <h1 className="font-serif text-32 leading-tight font-semibold tracking-tight">{task.title}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <LevelBadge level={task.level} />
        {badges}
      </div>
      <Prose markdown={task.description} className="mt-6" />
      {extras}

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
        <CardTitle>{checklistTitle}</CardTitle>
        <span className="text-15 font-semibold" aria-live="polite">{score}</span>
      </div>
      {note && <p className="mt-1 text-15 text-ink-soft">{note}</p>}
      <ul className="mt-2" aria-live="polite">
        {checks.map((check) => (
          <RubricItem key={check.id} state={check.state} text={check.text} points={check.points} maxPoints={check.maxPoints} found={check.found} hint={check.hint} />
        ))}
      </ul>
      {footer}
    </Panel>
  )
}
