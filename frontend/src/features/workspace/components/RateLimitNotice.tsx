import { useLocation } from 'react-router-dom'
import type { ExecutionWait } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { ButtonLink } from '../../../shared/ui/Button'

const REASON: Readonly<Record<ExecutionWait['reason'], string>> = {
  rate_limited: 'Túl sok futtatás rövid idő alatt.',
  busy: 'A kódfuttató most túlterhelt. Ez nem a te hibád.',
}

interface Props {
  wait: ExecutionWait
  /** A hátralévő idő; nullánál a gombok újra használhatók. */
  seconds: number
}

/**
 * Futtatási korlát (#148) az eredménypanel helyén: mennyit kell várni, és
 * vendégnél az, hogy bejelentkezve több futtatás jár.
 */
export function RateLimitNotice({ wait, seconds }: Props) {
  const location = useLocation()

  return (
    <Banner
      kind="warn"
      data-testid="rate-limit-notice"
      title={seconds > 0 ? REASON[wait.reason] : 'Most már újra futtathatsz.'}
      action={
        wait.guest && (
          <ButtonLink to="/bejelentkezes" state={{ from: location.pathname + location.search }} variant="secondary">
            Belépés a magasabb limitért
          </ButtonLink>
        )
      }
    >
      {seconds > 0 && (
        <>
          {/* A másodpercenként változó számot a képernyőolvasó nem olvassa fel újra és újra: ő a kezdőértéket kapja. */}
          <span aria-hidden="true">
            Újra próbálhatod <strong className="tabular-nums">{seconds}</strong> másodperc múlva.
          </span>
          <span className="sr-only">Újra próbálhatod {wait.seconds} másodperc múlva.</span>
        </>
      )}
    </Banner>
  )
}
