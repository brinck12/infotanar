import type { Verdict } from '../../../../types'
import { VERDICT_META } from '../../../workspace/verdicts'

const number = new Intl.NumberFormat('hu-HU')
const percent = new Intl.NumberFormat('hu-HU', { style: 'percent', maximumFractionDigits: 0 })

/** Megjelenítési sorrend: előbb a sikeres, aztán a diák hibái, a rendszerhiba a végén. */
const ORDER: Verdict[] = ['accepted', 'wrong_answer', 'runtime_error', 'compilation_error', 'time_limit_exceeded', 'constraint_violation', 'system_error']

/** A beadások állapotmegoszlása vízszintes sávokkal; a szám és a százalék is ki van írva (nem csak a sáv hossza hordozza). */
export function VerdictDistribution({ verdicts }: { verdicts: Record<string, number> }) {
  const entries = ORDER.filter((verdict) => (verdicts[verdict] ?? 0) > 0).map((verdict) => ({ verdict, count: verdicts[verdict] ?? 0 }))
  const total = entries.reduce((sum, entry) => sum + entry.count, 0)

  if (total === 0) return <p className="text-sm text-slate-400">Az időszakban nem volt értékelt beadás.</p>

  return (
    <ul className="space-y-2" data-testid="verdict-distribution">
      {entries.map(({ verdict, count }) => (
        <li key={verdict}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-slate-200">{VERDICT_META[verdict].label}</span>
            <span className="font-mono text-xs text-slate-300">
              {number.format(count)} · {percent.format(count / total)}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
            <div className={`h-full ${verdict === 'accepted' ? 'bg-emerald-500' : verdict === 'system_error' ? 'bg-slate-500' : 'bg-amber-500'}`} style={{ width: `${(count / total) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
