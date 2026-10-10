import { LANGUAGE_LABEL } from '../../../shared/domain/labels'
import { exactTime, relativeTime } from '../../../shared/format/relativeTime'
import { Badge } from '../../../shared/ui/Badge'
import { StateIcon, type StateKind } from '../../../shared/ui/Icon'
import type { SubmissionSummary } from '../../../types'
import { isUnfinished, submissionLabel, submissionVerdict } from '../api'

/** Elfogadva: pipa; befejezetlen kiértékelés: üres kör; minden más: hiba. */
function stateOf(submission: SubmissionSummary): StateKind {
  if (isUnfinished(submission)) return 'empty'

  return submissionVerdict(submission) === 'accepted' ? 'ok' : 'bad'
}

/**
 * Egy beadás egy sorban: eredmény (ikon + szöveg), nyelv, sikeres tesztek és
 * az időpont. A `title` a sor elejére kerül (pl. a feladat címe a vegyes listában).
 */
export function SubmissionLine({ submission, title }: { submission: SubmissionSummary; title?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-15">
      <StateIcon kind={stateOf(submission)} />
      {title && <span className="font-semibold text-ink">{title}</span>}
      <span className="font-semibold text-ink">{submissionLabel(submission)}</span>
      <Badge kind="lang">{LANGUAGE_LABEL[submission.language]}</Badge>
      {submission.total_count > 0 && (
        <span className="text-ink-soft tabular-nums">
          {submission.passed_count} / {submission.total_count} teszt
        </span>
      )}
      <time dateTime={submission.created_at} title={exactTime(submission.created_at)} className="text-ink-soft">
        {relativeTime(submission.created_at)}
      </time>
    </span>
  )
}
