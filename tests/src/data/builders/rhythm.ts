import type { WeeklyRhythm } from '../../api/areas/rhythm'
import type { User } from '../../api/types'

/** A mockolt hetek rogzitett hete: 2026-10-19 (hetfo) .. 2026-10-25 (vasarnap), "ma" csutortok. */
export const MOCK_WEEK = {
  start: '2026-10-19',
  today: '2026-10-22',
  dates: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'],
  dayNames: ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'],
} as const

/** A heti ritmus valasza: az `active` a tanulasi napok indexei (0 = hetfo). */
export function buildRhythm(active: number[] = [], overrides: Partial<WeeklyRhythm> = {}): WeeklyRhythm {
  return {
    week_start: MOCK_WEEK.start,
    today: MOCK_WEEK.today,
    days: MOCK_WEEK.dates.map((date, index) => ({ date, active: active.includes(index) })),
    goal_days: null,
    goal_reached: false,
    ...overrides,
  }
}

/** Bejelentkezett, megerositett diak a mockolt oldalakhoz (jelszoval, Google nelkul, nem feliratkozva). */
export function buildStudent(overrides: Partial<User> = {}): User {
  return {
    id: 7,
    name: 'Teszt Elek',
    email: 'teszt@example.test',
    role: 'student',
    email_verified_at: '2026-01-01T00:00:00+00:00',
    has_password: true,
    linked_providers: [],
    weekly_summary: false,
    ...overrides,
  }
}
