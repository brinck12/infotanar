import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { hibaUzenet } from '../../../shared/api/errors'
import { LANGUAGE_LABEL } from '../../../shared/domain/labels'
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
      className="rounded-lg border border-slate-800 bg-slate-900"
    >
      <summary className="cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-slate-200 hover:text-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
        Beadásaim
      </summary>

      <div className="border-t border-slate-800">
        {history.isError ? (
          <p role="alert" className="p-4 text-sm text-red-300">
            {hibaUzenet(history.error)}
          </p>
        ) : history.isPending ? (
          <p className="p-4 text-sm text-slate-400">Beadások betöltése…</p>
        ) : submissions.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">Ehhez a feladathoz még nincs beadásod.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
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
          <div className="border-t border-slate-800 p-3">
            <button
              type="button"
              onClick={() => void history.fetchNextPage()}
              disabled={history.isFetchingNextPage}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 disabled:opacity-60"
            >
              {history.isFetchingNextPage ? 'Betöltés…' : 'Korábbiak betöltése'}
            </button>
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
    <li data-testid="submission-item">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="block w-full px-4 py-3 text-left transition hover:bg-slate-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset"
      >
        <SubmissionLine submission={submission} />
      </button>
      {open && (
        <div id={panelId} className="space-y-3 border-t border-slate-800 bg-slate-950/40 p-4">
          <SubmissionDetails submission={submission} restorable={restorable} onRestore={onRestore} />
        </div>
      )}
    </li>
  )
}

function SubmissionDetails({ submission, restorable, onRestore }: Pick<ItemProps, 'submission' | 'restorable' | 'onRestore'>) {
  const detail = useQuery(submissionQuery(submission.id))

  if (detail.isError) return <p className="text-sm text-red-300">{hibaUzenet(detail.error)}</p>
  if (detail.isPending) return <p className="text-sm text-slate-400">Beadás betöltése…</p>

  const result = asRunResult(detail.data)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onRestore(detail.data)}
          disabled={!restorable}
          className="rounded-lg bg-sky-700 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Betöltés a szerkesztőbe
        </button>
        <p className="text-xs text-slate-400">
          {restorable
            ? 'A mostani kódod helyére kerül; a szerkesztőben Ctrl+Z-vel visszavonható.'
            : `Ennél a feladatnál a(z) ${LANGUAGE_LABEL[submission.language]} nyelv már nem választható.`}
        </p>
      </div>

      {result ? (
        <ResultPanel loading={false} error={null} result={result} mode="submit" />
      ) : (
        <p className="text-sm text-slate-400">Ennek a beadásnak a kiértékelése nem fejeződött be, ezért nincs eredménye.</p>
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
