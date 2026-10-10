const relative = new Intl.RelativeTimeFormat('hu', { numeric: 'auto' })
const absolute = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' })

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** „5 perce”, „tegnap”, egy hétnél régebbinél a dátum. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000)

  if (seconds < MINUTE) return 'az imént'
  if (seconds < HOUR) return relative.format(-Math.floor(seconds / MINUTE), 'minute')
  if (seconds < DAY) return relative.format(-Math.floor(seconds / HOUR), 'hour')
  if (seconds < 7 * DAY) return relative.format(-Math.floor(seconds / DAY), 'day')

  return absolute.format(date)
}

/** A pontos időpont, pl. buboréksúgóba a relatív idő mellé. */
export function exactTime(iso: string): string {
  return absolute.format(new Date(iso))
}
