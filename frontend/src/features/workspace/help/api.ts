import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../../shared/api/client'
import type { HintBook, SolutionView } from '../../../types'

/** A bejelentkezés/kijelentkezés minden `auth`-tól eltérő lekérdezést nulláz, így ezek sem maradnak át másik fiókra. */
export const helpKeys = {
  all: ['help'] as const,
  hints: (taskId: number) => [...helpKeys.all, 'hints', taskId] as const,
  solution: (taskId: number) => [...helpKeys.all, 'solution', taskId] as const,
}

export const hintsQuery = (taskId: number) =>
  queryOptions({
    queryKey: helpKeys.hints(taskId),
    queryFn: async ({ signal }) => (await http.get<Envelope<HintBook>>(`/tasks/${taskId}/hints`, { signal })).data.data,
  })

/** A következő tippet a szerver választja; a válasz az összes eddig megnyitottat tartalmazza. */
export async function revealHint(taskId: number): Promise<HintBook> {
  return (await http.post<Envelope<HintBook>>(`/tasks/${taskId}/hints/reveal`)).data.data
}

export const solutionQuery = (taskId: number) =>
  queryOptions({
    queryKey: helpKeys.solution(taskId),
    queryFn: async ({ signal }) => (await http.get<Envelope<SolutionView>>(`/tasks/${taskId}/solution`, { signal })).data.data,
  })

/** "Megnézem a megoldást": rögzített megnyitás megoldás előtt. */
export async function revealSolution(taskId: number): Promise<SolutionView> {
  return (await http.post<Envelope<SolutionView>>(`/tasks/${taskId}/solution/reveal`)).data.data
}
