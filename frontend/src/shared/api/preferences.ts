import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from './client'
import { DEFAULT_PREFERENCES, EXAM_PERIODS, WEEKLY_HOURS, type StudyPreferences } from '../domain/preferences'

/**
 * A tanuló céljai a szerveren (`users.preferences`). A vezetéken snake_case
 * kulcsok mennek, a felület a camelCase `StudyPreferences` típust használja.
 */
interface WirePreferences {
  level: string
  exam_period: string
  language: string
  weekly_hours: string
}

export const preferenceKeys = {
  all: ['preferences'] as const,
  mine: () => [...preferenceKeys.all, 'mine'] as const,
}

/**
 * A szerver válasza a felület típusára. Amit a felület már nem ismer (például
 * egy lejárt, a listából kivett vizsgaidőszak), annak a helyére az alapérték
 * kerül, hogy az űrlap mindig érvényes választást mutasson.
 */
function fromWire(wire: WirePreferences): StudyPreferences {
  return {
    level: wire.level === 'emelt' || wire.level === 'kozep' ? wire.level : DEFAULT_PREFERENCES.level,
    examPeriod: EXAM_PERIODS.find((period) => period.value === wire.exam_period)?.value ?? DEFAULT_PREFERENCES.examPeriod,
    language: wire.language === 'python' || wire.language === 'csharp' ? wire.language : DEFAULT_PREFERENCES.language,
    weeklyHours: WEEKLY_HOURS.find((option) => option.value === wire.weekly_hours)?.value ?? DEFAULT_PREFERENCES.weeklyHours,
  }
}

function toWire(preferences: StudyPreferences): WirePreferences {
  return {
    level: preferences.level,
    exam_period: preferences.examPeriod,
    language: preferences.language,
    weekly_hours: preferences.weeklyHours,
  }
}

/** A mentett célok; `null`, ha a tanuló még sosem mentett. */
export const preferencesQuery = () =>
  queryOptions({
    queryKey: preferenceKeys.mine(),
    queryFn: async ({ signal }) => {
      const wire = (await http.get<Envelope<WirePreferences | null>>('/account/preferences', { signal })).data.data
      return wire === null ? null : fromWire(wire)
    },
  })

export async function savePreferences(preferences: StudyPreferences): Promise<StudyPreferences> {
  return fromWire((await http.put<Envelope<WirePreferences>>('/account/preferences', toWire(preferences))).data.data)
}
