import { LANGUAGE_LABEL } from '../../../shared/domain/labels'
import { exactTime, relativeTime } from '../../../shared/format/relativeTime'
import type { SubmissionSummary } from '../../../types'
import { VerdictIcon } from '../../workspace/components/VerdictIcon'
import { VERDICT_META, type VerdictTone } from '../../workspace/verdicts'
import { submissionLabel, submissionVerdict } from '../api'

const TONE_TEXT: Readonly<Record<VerdictTone, string>> = {
  success: 'text-emerald-300',
  danger: 'text-red-300',
  warning: 'text-amber-300',
  compile: 'text-fuchsia-300',
  runtime: 'text-orange-300',
  rule: 'text-indigo-300',
  neutral: 'text-slate-300',
}

/**
 * Egy beadás egy sorban: eredmény (ikon + szöveg), nyelv, sikeres tesztek és
 * az időpont. A `title` a sor elejére kerül (pl. a feladat címe a vegyes listában).
 */
export function SubmissionLine({ submission, title }: { submission: SubmissionSummary; title?: string }) {
  const verdict = submissionVerdict(submission)

  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {title && <span className="font-medium text-slate-100">{title}</span>}
      <span className={`inline-flex items-center gap-1.5 ${TONE_TEXT[VERDICT_META[verdict].tone]}`}>
        <VerdictIcon verdict={verdict} className="h-4 w-4" />
        {submissionLabel(submission)}
      </span>
      <span className="text-slate-400">{LANGUAGE_LABEL[submission.language]}</span>
      {submission.total_count > 0 && (
        <span className="tabular-nums text-slate-400">
          {submission.passed_count} / {submission.total_count} teszt
        </span>
      )}
      <time dateTime={submission.created_at} title={exactTime(submission.created_at)} className="text-slate-400">
        {relativeTime(submission.created_at)}
      </time>
    </span>
  )
}
