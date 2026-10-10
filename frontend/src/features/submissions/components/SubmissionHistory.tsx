import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { LANGUAGE_LABEL } from '../../../shared/domain/labels'
import { Button } from '../../../shared/ui/Button'
import { LoadError, Skeleton } from '../../../shared/ui/States'
import type { LanguageKey, RunResponse, SubmissionDetail, SubmissionSummary } from '../../../types'
import { ResultPanel } from '../../workspace/components/ResultPanel'
import { submissionQuery, taskSubmissionsQuery } from '../api'
import { SubmissionLine } from './SubmissionLine'

interface Props {
  taskId: number
  /** A feladatnál most engedélyezett nyelvek: csak ilyen beadás tölthető vissza. */
  allowedLanguages: LanguageKey[]
  onRestore: (submission: SubmissionDetail) => void
}

/**
 * „Beadásaim” a munkaterületen (#147): a feladathoz tartozó korábbi beadások.
 * Egy sort kinyitva látszik az eredménye, és a kódja visszatölthető a
 * szerkesztőbe. A lista csak az első lenyitáskor töltődik le.
 */
export function SubmissionHistory({ taskId, allowedLanguages, onRestore }: Props) {
  const [opened, setOpened] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const history = useInfiniteQuery({ ...taskSubmissionsQuery(taskId), enabled: opened })
  const submissions = history.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <details
      data-testid="submission-history"
      onToggle={(event) => {
        if (event.currentTarget.open) setOpened(true)
      }}
      className="border-t border-grid"
    >
      <summary className="flex min-h-11 cursor-pointer items-center px-5 text-16 font-semibold text-ink hover:bg-note md:px-6">
        Beadásaim
      </summary>

      <div className="border-t border-grid">
        {history.isError ? (
          <div className="px-5 py-4 md:px-6">
            <LoadError error={history.error} onRetry={() => void history.refetch()} title="Nem sikerült betölteni a beadásaidat" />
          </div>
        ) : history.isPending ? (
          <Skeleton lines={2} label="Beadások betöltése…" className="px-5 py-4 md:px-6" />
        ) : submissions.length === 0 ? (
          <p className="px-5 py-4 text-15 leading-relaxed text-ink-soft md:px-6">
            Ehhez a feladathoz még nincs beadásod. A Beadás gomb menti el a megoldásodat.
          </p>
        ) : (
          <ul>
            {submissions.map((submission) => (
              <HistoryItem
                key={submission.id}
                submission={submission}
                open={submission.id === selectedId}
                onToggle={() => setSelectedId((current) => (current === submission.id ? null : submission.id))}
                restorable={allowedLanguages.includes(submission.language)}
                onRestore={onRestore}
              />
            ))}
          </ul>
        )}

        {history.hasNextPage && (
          <div className="border-t border-grid px-5 py-3 md:px-6">
            <Button variant="secondary" busy={history.isFetchingNextPage} busyLabel="Betöltés…" onClick={() => void history.fetchNextPage()}>
              Korábbiak betöltése
            </Button>
          </div>
        )}
      </div>
    </details>
  )
}

interface ItemProps {
  submission: SubmissionSummary
  open: boolean
  onToggle: () => void
  restorable: boolean
  onRestore: (submission: SubmissionDetail) => void
}

function HistoryItem({ submission, open, onToggle, restorable, onRestore }: ItemProps) {
  const panelId = `beadas-${submission.id}`

  return (
    <li data-testid="submission-item" className="border-b border-grid last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-11 w-full items-center px-5 py-2 text-left hover:bg-note md:px-6"
      >
        <SubmissionLine submission={submission} />
      </button>
      {open && (
        <div id={panelId} className="flex flex-col gap-4 border-t border-grid bg-paper px-5 py-4 md:px-6">
          <SubmissionDetails submission={submission} restorable={restorable} onRestore={onRestore} />
        </div>
      )}
    </li>
  )
}

function SubmissionDetails({ submission, restorable, onRestore }: Pick<ItemProps, 'submission' | 'restorable' | 'onRestore'>) {
  const detail = useQuery(submissionQuery(submission.id))

  if (detail.isError) return <LoadError error={detail.error} onRetry={() => void detail.refetch()} title="Nem sikerült betölteni a beadást" />
  if (detail.isPending) return <Skeleton lines={2} label="Beadás betöltése…" />

  const result = asRunResult(detail.data)

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="secondary" icon="undo" onClick={() => onRestore(detail.data)} disabled={!restorable}>
          Betöltés a szerkesztőbe
        </Button>
        <p className="min-w-0 flex-1 basis-56 text-14 leading-normal text-ink-soft">
          {restorable
            ? 'A mostani kódod helyére kerül; a szerkesztőben Ctrl+Z-vel visszavonható.'
            : `Ennél a feladatnál a(z) ${LANGUAGE_LABEL[submission.language]} nyelv már nem választható.`}
        </p>
      </div>

      {result ? (
        <ResultPanel loading={false} error={null} result={result} mode="submit" />
      ) : (
        <p className="text-15 leading-relaxed text-ink-soft">
          Ennek a beadásnak a kiértékelése nem fejeződött be, ezért nincs eredménye. Add be újra a megoldást.
        </p>
      )}
    </>
  )
}

/** A beadás eredménye az eredménypanel alakjában; null, ha a kiértékelés nem fejeződött be. */
function asRunResult(submission: SubmissionDetail): RunResponse | null {
  if (submission.status === 'pending' || submission.status === 'running') return null

  return {
    status: submission.status,
    verdict: submission.verdict ?? undefined,
    verdict_label: submission.verdict_label ?? undefined,
    results: submission.results,
  }
}
