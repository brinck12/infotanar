interface Props {
  label: string
  /** A fő érték, már formázva. */
  value: string
  /** Rövid kiegészítés az érték alatt. */
  detail?: string
  /** Változás az előző időszakhoz képest; hiányában nem jelenik meg. */
  change?: Change
}

/** Az előző időszakhoz mért változás, és hogy a növekedés jó-e (pl. a sikertelen fizetéseknél nem). */
export interface Change {
  current: number
  previous: number
  /** false: a csökkenés a jó (sikertelen fizetés, lemorzsolódás). */
  upIsGood?: boolean
  /** Hogyan írjuk ki a különbséget (alapból százalék); az arányoknál százalékpont. */
  kind?: 'percent' | 'points'
}

const percent = new Intl.NumberFormat('hu-HU', { style: 'percent', maximumFractionDigits: 0 })
const points = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 1, signDisplay: 'always' })

/** Egy mutató a számával és az előző időszakhoz mért változásával (nem csak színnel jelezve: nyíl és szöveg is). */
export function StatTile({ label, value, detail, change }: Props) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4" data-testid="stat-tile">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
      {change && <ChangeNote change={change} />}
    </div>
  )
}

function ChangeNote({ change }: { change: Change }) {
  const { current, previous, upIsGood = true, kind = 'percent' } = change
  const difference = current - previous

  if (difference === 0) return <p className="mt-2 text-xs text-slate-400">Nem változott az előző időszakhoz képest</p>

  // Előző időszak 0: a százalék nem értelmezhető, ezt mondjuk ki.
  const text =
    kind === 'points'
      ? `${points.format(difference * 100)} százalékpont az előző időszakhoz képest`
      : previous === 0
        ? 'Az előző időszakban nem volt'
        : `${difference > 0 ? '+' : ''}${percent.format(difference / previous)} az előző időszakhoz képest`
  const good = difference > 0 === upIsGood
  const arrow = difference > 0 ? '▲' : '▼'

  return (
    <p className={`mt-2 text-xs ${good ? 'text-emerald-300' : 'text-amber-300'}`}>
      <span aria-hidden="true">{arrow} </span>
      {text}
    </p>
  )
}
