import type { ReactNode } from 'react'
import { Badge } from './Badge'
import { pointsLabel } from './format'
import { StateIcon } from './Icon'

export type RubricState = 'ok' | 'bad' | 'manual'

interface RubricItemProps {
  state: RubricState
  text: ReactNode
  points: number
  maxPoints: number
  /** Amit az ellenőrző a fájlban talált. */
  found?: string | null
  /** Hibánál: mit javíts. Kézi tételnél: mivel hasonlítsd össze. */
  hint?: ReactNode
}

/** Az értékelőlap egy sora: mit találtunk, mennyi a pont, mit javíts. */
export function RubricItem({ state, text, points, maxPoints, found, hint }: RubricItemProps) {
  return (
    <li className="flex gap-3 border-t border-grid py-3">
      <StateIcon kind={state} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
          <span className="min-w-0 flex-1 basis-64 text-15 leading-normal font-medium">{text}</span>
          {state === 'manual' ? (
            <Badge kind="manual">{maxPoints} pont, kézi</Badge>
          ) : (
            <Badge kind={state === 'ok' ? 'ok' : 'bad'}>{pointsLabel(points, maxPoints)}</Badge>
          )}
        </div>
        {found && (
          <p className="mt-1.5 text-13 text-ink-soft">
            Amit találtunk: <span className="font-mono text-ink">{found}</span>
          </p>
        )}
        {hint && <p className="mt-1.5 text-14 leading-normal">{hint}</p>}
      </div>
    </li>
  )
}
