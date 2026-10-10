import { useState } from 'react'
import { EXAM_PARTS, EXAM_TOTAL } from '../../../shared/domain/exam'
import { cx } from '../../../shared/ui/cx'
import { Panel } from '../../../shared/ui/Panel'
import type { Level } from '../../../types'

const LEVELS: ReadonlyArray<{ value: Level; label: string }> = [
  { value: 'kozep', label: 'Középszint' },
  { value: 'emelt', label: 'Emelt szint' },
]

const INTRO: Readonly<Record<Level, string>> = {
  kozep: 'A középszintű gyakorlati vizsga 180 perc és 100 pont. A programozás ebből csak 15 pont, a többi a másik négy részből jön.',
  emelt:
    'Emelt szinten a gyakorlati rész 240 perc és 120 pont. A 35 pontos első feladat választható: dokumentumkészítés (szöveg, grafika és weboldal vegyesen) vagy táblázatkezelés. Ehhez jön a 30 pontos szóbeli.',
}

/** „Hol vannak a pontok?”: a gyakorlati vizsga részei arányosan, szintenként. */
export function PointsBar() {
  const [level, setLevel] = useState<Level>('kozep')
  const parts = EXAM_PARTS[level]
  const summary = parts.map((part) => `${part.name} ${part.points}`).join(', ')

  return (
    <Panel as="section" pad="lg" aria-labelledby="pontok-cim">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="pontok-cim" className="font-serif text-24 leading-snug font-semibold tracking-tight">
          Hol vannak a pontok?
        </h2>
        <div role="group" aria-label="Szint" className="inline-flex overflow-hidden rounded-md border border-ink">
          {LEVELS.map((option, index) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={option.value === level}
              onClick={() => setLevel(option.value)}
              className={cx(
                'min-h-11 px-4 text-15 font-semibold',
                index > 0 && 'border-l border-ink',
                option.value === level ? 'bg-ink text-sheet' : 'bg-sheet text-ink hover:bg-note',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 mb-5 max-w-prose text-16 leading-relaxed text-ink-soft">{INTRO[level]}</p>

      <div role="img" aria-label={`${level === 'kozep' ? 'Középszint' : 'Emelt szint'}: ${summary} pont`}>
        <div className="flex h-5 gap-0.75">
          {parts.map((part, index) => (
            <div
              key={part.key}
              style={{ flexGrow: part.points }}
              className={cx(
                'basis-0',
                part.key === 'programozas' ? 'bg-accent' : 'bg-ink',
                index === 0 && 'rounded-l-sm',
                index === parts.length - 1 && 'rounded-r-sm',
              )}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-0.75">
          {parts.map((part) => (
            <p key={part.key} style={{ flexGrow: part.points }} className="min-w-0 basis-0 text-13 leading-snug break-words text-ink-soft">
              <strong className="block text-15 text-ink">{part.points} pont</strong>
              {part.name}
            </p>
          ))}
        </div>
      </div>
      <p className="mt-4 text-14 text-ink-soft">
        Összesen {EXAM_TOTAL[level].points} pont, {EXAM_TOTAL[level].minutes} perc.
      </p>
    </Panel>
  )
}
