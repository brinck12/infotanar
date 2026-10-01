import { LESSON_STATUS_LABEL } from '../../../shared/domain/labels'
import type { LessonProgressStatus } from '../../../types'

const STYLE: Readonly<Record<LessonProgressStatus, string>> = {
  not_started: 'border-slate-700 bg-slate-900 text-slate-400',
  in_progress: 'border-amber-800 bg-amber-950 text-amber-300',
  completed: 'border-emerald-800 bg-emerald-950 text-emerald-300',
}

/**
 * Egy lecke állapota: szín + ikon + szöveg, hogy színtévesztők és
 * képernyőolvasók számára is egy pillantásra egyértelmű legyen.
 */
export function LessonStatusBadge({ status }: { status: LessonProgressStatus }) {
  return (
    <span
      data-testid="lesson-status"
      data-status={status}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${STYLE[status]}`}
    >
      <StatusIcon status={status} />
      {LESSON_STATUS_LABEL[status]}
    </span>
  )
}

function StatusIcon({ status }: { status: LessonProgressStatus }) {
  const common = { viewBox: '0 0 16 16', 'aria-hidden': true, className: 'h-3.5 w-3.5' } as const

  switch (status) {
    case 'completed':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="8" cy="8" r="6.5" />
          <path d="m5 8.2 2 2 4-4.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'in_progress':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth={1.5} />
          <path d="M8 1.5a6.5 6.5 0 0 1 0 13Z" fill="currentColor" />
        </svg>
      )
    case 'not_started':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="2.5 2">
          <circle cx="8" cy="8" r="6.5" />
        </svg>
      )
  }
}
