import type { ReactNode } from 'react'
import type { Level } from '../../types'
import { LEVEL_LABEL } from '../domain/labels'
import { cx } from './cx'
import { Icon, type IconName } from './Icon'

export type BadgeKind =
  | 'kozep'
  | 'emelt'
  | 'lang'
  | 'free'
  | 'ok'
  | 'bad'
  | 'prem'
  | 'hidden'
  | 'manual'
  | 'neutral'
  | 'now'
  | 'pub'
  | 'draft'
  | 'admin'

const KIND: Readonly<Record<BadgeKind, string>> = {
  kozep: 'border border-ink text-ink',
  emelt: 'border border-ink bg-ink text-sheet',
  lang: 'bg-chip text-chip-ink',
  free: 'bg-accent-soft text-accent',
  ok: 'bg-accent-soft text-accent',
  bad: 'bg-wrong-soft text-wrong',
  prem: 'border border-muted text-ink-soft',
  hidden: 'border border-dashed border-muted text-ink-soft',
  manual: 'border border-ink text-ink',
  neutral: 'bg-note text-ink',
  now: 'bg-ink text-sheet',
  pub: 'bg-accent-soft text-accent',
  draft: 'border border-dashed border-ink-soft text-ink-soft',
  admin: 'bg-ink text-sheet',
}

const KIND_ICON: Partial<Record<BadgeKind, IconName>> = { prem: 'lock', hidden: 'lock', manual: 'eye' }

export function Badge({ kind = 'neutral', children, className }: { kind?: BadgeKind; children: ReactNode; className?: string }) {
  const icon = KIND_ICON[kind]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-13 leading-5 font-semibold whitespace-nowrap',
        KIND[kind],
        className,
      )}
    >
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}

/** Szintjelvény: a középszint körvonalas, az emelt szint kitöltött. */
export function LevelBadge({ level }: { level: Level }) {
  return <Badge kind={level}>{LEVEL_LABEL[level]}</Badge>
}
