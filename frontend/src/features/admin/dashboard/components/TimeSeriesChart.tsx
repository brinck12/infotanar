import { useId } from 'react'
import { useElementWidth } from '../../../../shared/hooks/useElementWidth'

export interface ChartSeries {
  label: string
  /** Napokonként, a `days` sorrendjében. */
  values: number[]
  /** Tailwind szín-osztály (`stroke-*` / `fill-*` alapja), pl. `sky`. */
  color: 'sky' | 'emerald' | 'amber'
}

interface Props {
  title: string
  days: string[]
  series: ChartSeries[]
  /** `bars`: oszlopok (egy sorozat, összegek); `lines`: vonalak (több sorozat is). */
  kind: 'bars' | 'lines'
  /** Az értékek kiírása (tengelyfelirat, adattábla). */
  format: (value: number) => string
}

/** Az első mérés előtti szélesség; utána a konténer tényleges szélessége számít. */
const FALLBACK_WIDTH = 640
const HEIGHT = 220
const PAD = { top: 12, right: 12, bottom: 28, left: 56 }

const STROKE = { sky: 'stroke-sky-400', emerald: 'stroke-emerald-400', amber: 'stroke-amber-400' } as const
const FILL = { sky: 'fill-sky-500', emerald: 'fill-emerald-500', amber: 'fill-amber-500' } as const
const SWATCH = { sky: 'bg-sky-400', emerald: 'bg-emerald-400', amber: 'bg-amber-400' } as const

const shortDay = new Intl.DateTimeFormat('hu-HU', { month: 'numeric', day: 'numeric' })
const longDay = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })

/**
 * Idősor egyszerű SVG-ben, külső diagramkönyvtár nélkül (#160). Az ábra a képernyőolvasónak egy
 * összefoglaló kép; a pontos értékek egy kinyitható adattáblában is megvannak, így a diagram
 * semmilyen információt nem csak vizuálisan hordoz.
 */
export function TimeSeriesChart({ title, days, series, kind, format }: Props) {
  const id = useId()
  const [frame, width] = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH)
  const peak = Math.max(0, ...series.flatMap((s) => s.values))
  const empty = peak === 0
  // Üres adatnál is legyen skála (0–1), a feliratok pedig ne ismétlődjenek (pl. kétszer "1 Ft").
  const max = Math.max(1, peak)
  const plotWidth = width - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const x = (index: number) => PAD.left + (days.length === 1 ? plotWidth / 2 : (index / (days.length - 1)) * plotWidth)
  const barSlot = plotWidth / Math.max(1, days.length)
  const barX = (index: number) => PAD.left + index * barSlot
  const y = (value: number) => PAD.top + plotHeight - (value / max) * plotHeight

  const labelIndexes = [...new Set([0, Math.floor((days.length - 1) / 2), days.length - 1])]
  const ticks = [...new Set([0, Math.round(max / 2), Math.round(max)])]
  const summary = series.map((s) => `${s.label}: összesen ${format(s.values.reduce((a, b) => a + b, 0))}`).join('; ')

  return (
    <figure className="rounded-lg border border-slate-800 bg-slate-900/60 p-4" data-testid="chart">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-200">{title}</span>
        <ul className="flex flex-wrap gap-3 text-xs text-slate-300">
          {series.map((s) => (
            <li key={s.label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${SWATCH[s.color]}`} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      </figcaption>

      <div ref={frame}>
        <svg width={width} height={HEIGHT} role="img" aria-label={`${title}. ${summary}`} className="block max-w-full">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-slate-800" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
                {format(Math.round(tick))}
              </text>
            </g>
          ))}

          {kind === 'bars' &&
            series[0]?.values.map((value, index) => (
              <rect
                key={days[index]}
                x={barX(index) + barSlot * 0.15}
                y={y(value)}
                width={barSlot * 0.7}
                height={PAD.top + plotHeight - y(value)}
                rx={2}
                className={FILL[series[0]?.color ?? 'sky']}
              />
            ))}

          {kind === 'lines' &&
            series.map((s) => (
              <polyline
                key={s.label}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
                className={STROKE[s.color]}
                points={s.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')}
              />
            ))}

          {empty && (
            <text x={PAD.left + plotWidth / 2} y={PAD.top + plotHeight / 2} textAnchor="middle" className="fill-slate-400 text-xs">
              Az időszakban nincs adat
            </text>
          )}

          {labelIndexes.map((index) => (
            <text
              key={index}
              x={kind === 'bars' ? barX(index) + barSlot / 2 : x(index)}
              y={HEIGHT - 8}
              textAnchor={index === 0 ? 'start' : index === days.length - 1 ? 'end' : 'middle'}
              className="fill-slate-400 text-[11px]"
            >
              {shortDay.format(new Date(`${days[index]}T12:00:00`))}
            </text>
          ))}
        </svg>
      </div>

      <details className="mt-2 text-xs text-slate-300">
        <summary className="cursor-pointer text-sky-300">Adattábla</summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table aria-labelledby={`${id}-caption`} className="w-full text-left">
            <caption id={`${id}-caption`} className="sr-only">
              {title}, napi értékek
            </caption>
            <thead>
              <tr className="text-slate-400">
                <th scope="col" className="py-1 pr-4 font-medium">
                  Nap
                </th>
                {series.map((s) => (
                  <th key={s.label} scope="col" className="py-1 pr-4 font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, index) => (
                <tr key={day} className="border-t border-slate-800">
                  <th scope="row" className="py-1 pr-4 font-normal">
                    {longDay.format(new Date(`${day}T12:00:00`))}
                  </th>
                  {series.map((s) => (
                    <td key={s.label} className="py-1 pr-4 font-mono">
                      {format(s.values[index] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
