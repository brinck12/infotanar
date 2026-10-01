import { Link, useLocation } from 'react-router-dom'
import type { LanguageKey, UnlockedTaskDetail } from '../../../types'
import { HintsSection } from './HintsSection'
import { SolutionSection } from './SolutionSection'

interface Props {
  task: UnlockedTaskDetail
  signedIn: boolean
  language: LanguageKey
  onCopySolution: (code: string) => void
}

/**
 * "Segítség" a feladat mellett (#154): tippek és mintamegoldás. Csak akkor
 * jelenik meg, ha a szerző írt valamelyiket. A tartalmat a szerver csak
 * bejelentkezett felhasználónak adja, ezért vendégnek csak a belépés hívószó.
 */
export function HelpPanel({ task, signedIn, language, onCopySolution }: Props) {
  const location = useLocation()
  const hintCount = task.hint_count ?? 0
  const hasSolution = task.solution_available === true

  if (hintCount === 0 && !hasSolution) return null

  return (
    <section aria-label="Segítség" data-testid="help-panel" className="space-y-5 rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-sm font-semibold text-slate-200">Elakadtál?</h2>

      {signedIn ? (
        <>
          {hintCount > 0 && <HintsSection taskId={task.id} hintCount={hintCount} />}
          {hasSolution && <SolutionSection taskId={task.id} language={language} onCopy={onCopySolution} />}
        </>
      ) : (
        <p className="text-sm text-slate-300">
          Tippek és mintamegoldás{' '}
          <Link to="/bejelentkezes" state={{ from: location.pathname + location.search }} className="text-sky-400 hover:underline">
            bejelentkezés
          </Link>{' '}
          után érhetők el.
        </p>
      )}
    </section>
  )
}
