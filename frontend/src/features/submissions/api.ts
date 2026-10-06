import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../shared/api/client'
import type { SubmissionDetail, SubmissionSummary, Verdict } from '../../types'
import { VERDICT_META } from '../workspace/verdicts'

/** Kurzoros lapozás: a `next_cursor` a következő oldalt kéri, `null` az utolsó oldalon. */
interface SubmissionPage {
  data: SubmissionSummary[]
  meta: { next_cursor: string | null }
}

export const submissionKeys = {
  /** Minden beadás-lekérdezés; új beadás után ezt érvénytelenítjük. */
  all: ['submissions'] as const,
  forTask: (taskId: number) => [...submissionKeys.all, 'task', taskId] as const,
  recent: () => [...submissionKeys.all, 'recent'] as const,
  one: (id: number) => [...submissionKeys.all, 'one', id] as const,
}

async function page(url: string, cursor: string | null, signal: AbortSignal): Promise<SubmissionPage> {
  return (await http.get<SubmissionPage>(url, { params: cursor ? { cursor } : undefined, signal })).data
}

/** A néző beadásai egy feladathoz, a legújabbal kezdve. */
export const taskSubmissionsQuery = (taskId: number) =>
  infiniteQueryOptions({
    queryKey: submissionKeys.forTask(taskId),
    queryFn: ({ pageParam, signal }) => page(`/tasks/${taskId}/submissions`, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.meta.next_cursor,
  })

/** A néző legutóbbi beadásai, feladattól függetlenül (első oldal). */
export const recentSubmissionsQuery = () =>
  queryOptions({
    queryKey: submissionKeys.recent(),
    queryFn: async ({ signal }) => (await page('/submissions', null, signal)).data,
  })

/** Egy beadás a forráskóddal és a tesztesetenkénti eredményekkel. */
export const submissionQuery = (id: number) =>
  queryOptions({
    queryKey: submissionKeys.one(id),
    queryFn: async ({ signal }) => (await http.get<Envelope<SubmissionDetail>>(`/submissions/${id}`, { signal })).data.data,
    // Egy lezárt beadás már nem változik.
    staleTime: Infinity,
  })

/** A beadás, amelynek a kiértékelése megszakadt (pl. a szerver közben leállt): nincs eredménye. */
export function isUnfinished(submission: SubmissionSummary): boolean {
  return submission.status === 'pending' || submission.status === 'running'
}

/** Régebbi beadásnál a verdict hiányozhat: a státuszból következtetünk. */
export function submissionVerdict(submission: SubmissionSummary): Verdict {
  if (submission.verdict) return submission.verdict

  return submission.status === 'passed' ? 'accepted' : submission.status === 'failed' ? 'wrong_answer' : 'system_error'
}

export function submissionLabel(submission: SubmissionSummary): string {
  if (isUnfinished(submission)) return 'Nem fejeződött be'

  return submission.verdict_label ?? VERDICT_META[submissionVerdict(submission)].label
}
