import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { cx } from '../../../shared/ui/cx'
import { Icon } from '../../../shared/ui/Icon'
import { attemptQuery, type ExamAttempt } from '../api'
import { formatDuration, useAttemptClock } from '../clock'

/**
 * Sáv a futó vizsga idejével és a visszalépéssel. A szerkesztőben megoldandó
 * vizsgarészeknél jelenik meg, hogy a tanuló ne veszítse el az időt és a
 * kontextust. Csak futó próbálkozásnál látszik.
 */
export function ExamStrip({ examId, attemptId }: { examId: number; attemptId: number }) {
  const attempt = useQuery({ ...attemptQuery(attemptId), staleTime: 0 })
  if (!attempt.data || attempt.data.state !== 'in_progress') return null
  return <Strip examId={examId} attempt={attempt.data} fetchedAt={attempt.dataUpdatedAt} />
}

function Strip({ examId, attempt, fetchedAt }: { examId: number; attempt: ExamAttempt; fetchedAt: number }) {
  const { remaining, elapsed, expired } = useAttemptClock(attempt, fetchedAt)

  return (
    <div
      className="sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-note px-4 py-2 md:px-6"
      data-testid="exam-strip"
    >
      <Link to={`/vizsgak/${examId}/fut?proba=${attempt.id}`} className="inline-flex min-h-11 items-center gap-2 text-15 font-semibold">
        <Icon name="chevron-left" size={18} />
        Vissza a vizsgához
      </Link>
      <span className="flex-auto text-14 text-ink-soft">{attempt.mode === 'exam' ? 'Vizsgahelyzet fut' : 'Gyakorlás fut'}</span>
      <span
        role="timer"
        aria-label={remaining === null ? 'Eltelt idő' : 'Hátralévő idő'}
        className={cx('inline-flex items-center gap-2', expired && 'text-wrong')}
      >
        <Icon name="clock" size={18} />
        <span className="font-mono text-17 font-medium">{formatDuration(remaining ?? elapsed)}</span>
        <span className="text-13 text-ink-soft">{remaining === null ? 'eltelt' : 'hátra'}</span>
      </span>
    </div>
  )
}
