import { Link, useLocation } from 'react-router-dom'
import type { ExecutionWait } from '../../../shared/api/errors'

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
    <div data-testid="rate-limit-notice" className="rounded-lg border border-amber-800 bg-amber-950/50 p-4 text-sm text-amber-100">
      {seconds > 0 ? (
        <p role="alert">
          {REASON[wait.reason]}{' '}
          {/* A másodpercenként változó számot a képernyőolvasó nem olvassa fel újra és újra: ő a kezdőértéket kapja. */}
          <span aria-hidden="true">
            Újra próbálhatod <strong className="tabular-nums">{seconds}</strong> másodperc múlva.
          </span>
          <span className="sr-only">Újra próbálhatod {wait.seconds} másodperc múlva.</span>
        </p>
      ) : (
        <p role="status">Most már újra futtathatsz.</p>
      )}

      {wait.guest && (
        <p className="mt-2">
          <Link
            to="/bejelentkezes"
            state={{ from: location.pathname + location.search }}
            className="rounded-sm text-sky-300 underline underline-offset-2 hover:text-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            Jelentkezz be a magasabb limitért
          </Link>
        </p>
      )}
    </div>
  )
}
