import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { cx } from '../../../shared/ui/cx'
import { Panel } from '../../../shared/ui/Panel'
import { CardTitle } from '../../../shared/ui/Text'
import { useAuth } from '../../auth/context'
import { rhythmQuery } from '../api'

const DAY_NAMES = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'] as const
const DAY_LETTERS = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'] as const

/**
 * Heti ritmus: a hét hét napja, a tanulással töltöttek kitöltve. Szándékosan nincs benne
 * szám, széria vagy lemaradás: az üres nap csak üres. A cél elérésekor egy ünneplő mondat
 * jelenik meg, egyébként semmi extra. Betöltés közben és hibánál nem rajzol ki semmit,
 * hogy ne zavarjon.
 */
export function WeeklyRhythm({ className }: { className?: string }) {
  const { user } = useAuth()
  const headingId = useId()
  const { data } = useQuery({ ...rhythmQuery(), enabled: user !== null })

  if (!data) return null

  return (
    <Panel as="section" pad="md" aria-labelledby={headingId} className={className}>
      <CardTitle id={headingId}>Heti ritmusod</CardTitle>
      <ol className="mt-3 flex gap-3">
        {data.days.map((day, index) => {
          const name = DAY_NAMES[index] ?? ''
          const isToday = day.date === data.today
          return (
            <li key={day.date} className="flex flex-col items-center gap-1.5">
              <span
                role="img"
                aria-label={`${name}${isToday ? ' (ma)' : ''}${day.active ? ', volt tanulás' : ''}`}
                className={cx('size-9 rounded-full border', day.active ? 'border-accent bg-accent' : isToday ? 'border-ink bg-sheet' : 'border-line bg-sheet')}
              />
              <span aria-hidden="true" className={cx('text-14', isToday ? 'font-semibold text-ink' : 'text-muted')}>
                {DAY_LETTERS[index]}
              </span>
            </li>
          )
        })}
      </ol>
      {data.goal_reached && <p className="mt-3 text-16 font-semibold text-accent-dark">Megvan a heti ritmusod.</p>}
    </Panel>
  )
}
