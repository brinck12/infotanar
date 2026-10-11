import { EXAM_PERIODS } from '../../../shared/domain/preferences'

/**
 * A vizsgaidőszakok, amelyekhez gyakorló vizsga tartozhat. A tanulói célok listája
 * (`EXAM_PERIODS`) csak az eljövendő időszakokat tartalmazza, a hivatalos, már
 * megjelent feladatsorok viszont múltbeli időszakokból valók, ezért ide azok is kellenek.
 */
const PAST_SESSIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '2024-05', label: '2024. május–június' },
  { value: '2024-10', label: '2024. október–november' },
  { value: '2025-05', label: '2025. május–június' },
  { value: '2025-10', label: '2025. október–november' },
  { value: '2026-05', label: '2026. május–június' },
  { value: '2026-10', label: '2026. október–november' },
]

export const SESSION_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [...PAST_SESSIONS, ...EXAM_PERIODS]

export const DEFAULT_SESSION = '2026-05'

/** A választható időszakok; egy listán kívüli, már mentett érték is megmarad. */
export function sessionOptionsFor(current: string | undefined): ReadonlyArray<{ value: string; label: string }> {
  return current && !SESSION_OPTIONS.some((option) => option.value === current) ? [...SESSION_OPTIONS, { value: current, label: current }] : SESSION_OPTIONS
}
