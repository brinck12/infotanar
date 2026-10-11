import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../shared/api/client'
import type { OralPractice } from './practice'

/** Egy szóbeli téma gyakorlási állapota a szerveren (`GET /oral/practice`). */
export interface OralPracticeRow extends OralPractice {
  topic: string
  last_practiced_at: string | null
}

/** A szerverre menő rész: a gyakorlások számát a külön végpont növeli. */
export type OralPracticeInput = Pick<OralPractice, 'checked' | 'notes' | 'scores'>

export const oralKeys = {
  all: ['oral'] as const,
  practice: () => [...oralKeys.all, 'practice'] as const,
}

/** A tanuló eddig gyakorolt témái; amelyikhez még nincs sor, azt nem gyakorolta. */
export const oralPracticeQuery = () =>
  queryOptions({
    queryKey: oralKeys.practice(),
    queryFn: async ({ signal }) => (await http.get<Envelope<OralPracticeRow[]>>('/oral/practice', { signal })).data.data,
  })

export async function saveOralPractice(topic: string, input: OralPracticeInput): Promise<OralPracticeRow> {
  return (await http.put<Envelope<OralPracticeRow>>(`/oral/practice/${topic}`, input)).data.data
}

export async function recordOralAttempt(topic: string): Promise<OralPracticeRow> {
  return (await http.post<Envelope<OralPracticeRow>>(`/oral/practice/${topic}/attempts`)).data.data
}
