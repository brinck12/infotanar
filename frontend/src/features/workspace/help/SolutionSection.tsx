import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { hibaUzenet } from '../../../shared/api/errors'
import { LANGUAGE_LABEL } from '../../../shared/domain/labels'
import type { LanguageKey, SolutionView } from '../../../types'
import { helpKeys, revealSolution, solutionQuery } from './api'
import { Markdown } from './Markdown'

interface Props {
  taskId: number
  /** A szerkesztőben kiválasztott nyelv: ehhez a nyelvhez mutatjuk a megoldást. */
  language: LanguageKey
  /** A megoldás bemásolása a szerkesztőbe (visszavonható). */
  onCopy: (code: string) => void
}

/**
 * Mintamegoldás (#154). A feloldás szabályait a szerver dönti el: elfogadott
 * beadás után látszik; előtte elég sikertelen beadás után kifejezett
 * megerősítéssel nyitható meg, és ez rögzítődik.
 */
export function SolutionSection({ taskId, language, onCopy }: Props) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const solution = useQuery(solutionQuery(taskId))
  const reveal = useMutation({
    mutationFn: () => revealSolution(taskId),
    onSuccess: (view) => {
      queryClient.setQueryData(helpKeys.solution(taskId), view)
      setConfirming(false)
    },
  })

  if (solution.isPending) return <p className="text-sm text-slate-400">Megoldás betöltése…</p>
  if (solution.isError) {
    return (
      <p role="alert" className="text-sm text-red-300">
        {hibaUzenet(solution.error)}
      </p>
    )
  }

  const view = solution.data

  return (
    <div className="space-y-3" data-testid="solution" data-status={view.status}>
      <h3 className="text-sm font-semibold text-slate-200">Mintamegoldás</h3>

      {view.status === 'locked' && (
        <p className="text-sm text-slate-300">
          A mintamegoldás akkor nyílik meg, ha van elfogadott beadásod, vagy legalább {view.required_failed_submissions} sikertelen
          beadásod ({view.failed_submissions} van eddig).
        </p>
      )}

      {view.status === 'revealable' && (
        <div className="space-y-2 text-sm">
          <p className="text-slate-300">
            {view.failed_submissions} sikertelen beadásod van, így megnézheted a mintamegoldást. Ha megnyitod, rögzítjük: a lecke
            ettől még teljesíthető, de a beadásaid „segítséggel” jelölést kapnak.
          </p>
          {confirming ? (
            <div role="group" aria-label="A megoldás megnyitásának megerősítése" className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={reveal.isPending}
                onClick={() => reveal.mutate()}
                className="rounded-lg bg-amber-700 px-4 py-1.5 font-medium text-white hover:bg-amber-600 disabled:opacity-60"
              >
                Igen, megnézem
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                Mégse
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 font-medium text-slate-100 hover:bg-slate-700"
            >
              Megnézem a megoldást
            </button>
          )}
          {reveal.isError && (
            <p role="alert" className="text-red-300">
              {hibaUzenet(reveal.error)}
            </p>
          )}
        </div>
      )}

      {view.status === 'unlocked' && <UnlockedSolution view={view} language={language} onCopy={onCopy} />}
    </div>
  )
}

function UnlockedSolution({ view, language, onCopy }: { view: SolutionView; language: LanguageKey; onCopy: (code: string) => void }) {
  const solution = view.solutions?.find((candidate) => candidate.language === language)

  if (!solution) {
    return (
      <p className="text-sm text-slate-300">
        {LANGUAGE_LABEL[language]} nyelvhez nincs mintamegoldás. Válts nyelvet a szerkesztőnél.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <pre
        aria-label={`Mintamegoldás – ${LANGUAGE_LABEL[language]}`}
        className="max-h-72 overflow-auto rounded border border-slate-800 bg-slate-950 p-3 font-mono text-xs whitespace-pre text-slate-200"
      >
        {solution.source_code}
      </pre>
      <button
        type="button"
        onClick={() => onCopy(solution.source_code)}
        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-700"
      >
        Másolás a szerkesztőbe
      </button>
      {solution.explanation && <Markdown>{solution.explanation}</Markdown>}
    </div>
  )
}
