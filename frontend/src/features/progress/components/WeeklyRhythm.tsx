import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { hibaUzenet } from '../../../shared/api/errors'
import { useWeeklySummary } from '../../../shared/hooks/useWeeklySummary'
import { Banner } from '../../../shared/ui/Banner'
import { Button } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { Panel } from '../../../shared/ui/Panel'
import { CardTitle } from '../../../shared/ui/Text'
import { useAuth } from '../../auth/context'
import { rhythmQuery } from '../api'

const DAY_NAMES = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'] as const
const DAY_LETTERS = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'] as const

const offerKey = (userId: number) => `infotanar.rhythm.offer.v1.u${userId}`

function offerDismissed(userId: number): boolean {
  try {
    return localStorage.getItem(offerKey(userId)) !== null
  } catch {
    return false
  }
}

function rememberDismissed(userId: number): void {
  try {
    localStorage.setItem(offerKey(userId), '1')
  } catch {
    // Tiltott tárhelyen a felkínálás a következő megnyitáskor újra megjelenhet; ez nem baj.
  }
}

/**
 * Heti ritmus: a hét hét napja, a tanulással töltöttek kitöltve. Szándékosan nincs benne
 * szám, széria vagy lemaradás: az üres nap csak üres. A cél elérésekor egy ünneplő mondat
 * jelenik meg, egyébként semmi extra. Betöltés közben és hibánál nem rajzol ki semmit,
 * hogy ne zavarjon. Alul, megerősített e-mail-címnél, egyszer felkínáljuk a heti összefoglalót.
 */
export function WeeklyRhythm({ className }: { className?: string }) {
  const { user } = useAuth()
  const headingId = useId()
  const { data } = useQuery({ ...rhythmQuery(), enabled: user !== null })
  const weekly = useWeeklySummary()
  const [asked, setAsked] = useState(false)
  const [declined, setDeclined] = useState(false)

  if (!data || !user) return null

  const showOffer = weekly.canEnable && !weekly.enabled && !declined && !offerDismissed(user.id)
  const thanks = asked && weekly.enabled

  function decline() {
    if (!user) return
    rememberDismissed(user.id)
    setDeclined(true)
  }

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

      {thanks && <p className="mt-4 border-t border-grid pt-4 text-16 leading-relaxed text-ink-soft">Rendben, hetente egy rövid összefoglalót kapsz. A fiókodnál bármikor kikapcsolhatod.</p>}
      {showOffer && (
        <div className="mt-4 flex flex-col gap-3 border-t border-grid pt-4">
          <p className="text-16 leading-relaxed text-ink-soft">Kérsz hetente egy rövid összefoglalót e-mailben? Csak akkor írunk, ha tanultál.</p>
          {weekly.isError && <Banner kind="error">{hibaUzenet(weekly.error)}</Banner>}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              busy={weekly.pending}
              busyLabel="Mentés…"
              onClick={() => {
                setAsked(true)
                weekly.set(true)
              }}
            >
              Kérem
            </Button>
            <Button variant="text" onClick={decline}>
              Most nem
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}
