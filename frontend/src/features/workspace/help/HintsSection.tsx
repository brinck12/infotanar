import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hibaUzenet } from '../../../shared/api/errors'
import { helpKeys, hintsQuery, revealHint } from './api'
import { Markdown } from './Markdown'

/**
 * Tippek (#154): a diák egyenként kéri őket, a szerver adja a következőt, és a
 * megnyitások rögzítődnek (eszközök és újratöltés között is megmaradnak). Itt csak
 * a megnyitott tippek szövege van meg, a többié le sem jön.
 */
export function HintsSection({ taskId, hintCount }: { taskId: number; hintCount: number }) {
  const queryClient = useQueryClient()
  const hints = useQuery(hintsQuery(taskId))
  const reveal = useMutation({
    mutationFn: () => revealHint(taskId),
    onSuccess: (book) => queryClient.setQueryData(helpKeys.hints(taskId), book),
  })

  if (hints.isPending) return <p className="text-sm text-slate-400">Tippek betöltése…</p>
  if (hints.isError) {
    return (
      <p role="alert" className="text-sm text-red-300">
        {hibaUzenet(hints.error)}
      </p>
    )
  }

  const { revealed } = hints.data
  const total = hints.data.count || hintCount
  const nextNumber = revealed.length + 1

  return (
    <div className="space-y-3" data-testid="hints">
      <h3 className="text-sm font-semibold text-slate-200">Tippek</h3>

      {revealed.length > 0 && (
        <ol className="space-y-2">
          {revealed.map((hint) => (
            <li key={hint.position} data-testid="hint" className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                {hint.position}. tipp / {total}
              </p>
              <Markdown>{hint.body}</Markdown>
            </li>
          ))}
        </ol>
      )}

      {nextNumber <= total ? (
        <button
          type="button"
          disabled={reveal.isPending}
          onClick={() => reveal.mutate()}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-100 transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
        >
          Tipp kérése ({nextNumber}/{total})
        </button>
      ) : (
        <p className="text-xs text-slate-400">
          Minden tippet megnyitottál ({total}/{total}).
        </p>
      )}

      {reveal.isError && (
        <p role="alert" className="text-sm text-red-300">
          {hibaUzenet(reveal.error)}
        </p>
      )}
    </div>
  )
}
