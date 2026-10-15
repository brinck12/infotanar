/** Gyakorlo vizsgak es az admin attekinto valaszainak semai (frontend: features/exams/api.ts, features/admin/overview/api.ts). */
import { z } from 'zod'
import { envelope, isoDateTime, rawPaginator } from './common'

const examPartInfo = z.object({
  id: z.number().int(),
  order: z.number().int(),
  key: z.string(),
  name: z.string(),
  points: z.number(),
  minutes: z.number(),
})

const attemptState = z.enum(['in_progress', 'submitted', 'evaluated'])

const examSummary = z.object({
  id: z.number().int(),
  session: z.string(),
  title: z.string(),
  level: z.enum(['kozep', 'emelt']),
  minutes: z.number(),
  points: z.number(),
  parts: z.array(examPartInfo),
  attempt: z.object({ id: z.number().int(), state: attemptState, score: z.number().nullable(), max_score: z.number(), completed_parts: z.array(z.number().int()) }).nullable(),
})

const examFile = z.object({ name: z.string(), size: z.number(), url: z.string() })

/** `GET /exams`. */
export const examsResponse = envelope(z.array(examSummary))

/** `GET /exams/{exam}`. */
export const examDetailResponse = envelope(
  examSummary.extend({
    parts: z.array(
      examPartInfo.extend({
        description: z.string(),
        steps: z.array(z.string()),
        sources: z.array(examFile),
        deliverable: z.string().nullable(),
        accepted_extensions: z.array(z.string()),
        software: z.string().nullable(),
        exercise_id: z.number().int().nullable(),
      })
    ),
    source_zip: examFile.nullable(),
  })
)

/** `POST /exams/{exam}/attempts`, `GET /exam-attempts/{attempt}`, `POST .../submit`, `POST .../parts/{part}/file`. */
export const examAttemptResponse = envelope(
  z.object({
    id: z.number().int(),
    exam_id: z.number().int(),
    mode: z.enum(['exam', 'practice']),
    state: attemptState,
    started_at: isoDateTime,
    deadline: isoDateTime.nullable(),
    server_time: isoDateTime,
    submissions: z.array(z.object({ part_id: z.number().int(), file_name: z.string().nullable(), uploaded_at: isoDateTime.nullable() })),
  })
)

/** `GET /exam-attempts/{attempt}/result`. */
export const examResultResponse = envelope(
  z.object({
    attempt_id: z.number().int(),
    exam: examSummary,
    score: z.number(),
    max_score: z.number(),
    pending_manual_points: z.number(),
    parts: z.array(z.object({ part_id: z.number().int(), score: z.number(), max_score: z.number(), summary: z.string().nullable(), file_submission_id: z.number().int().nullable() })),
    review: z.array(z.object({ lesson_id: z.number().int(), title: z.string(), track: z.string() })),
  })
)

/** `GET /admin/overview`. */
export const adminOverviewResponse = envelope(
  z.object({
    users: z.object({ total: z.number().int(), unverified: z.number().int() }),
    subscribers: z.object({ active: z.number().int(), past_due: z.number().int() }),
    invoices: z.object({ attention: z.number().int() }),
    catalog: z.object({ tracks: z.number().int(), draft_tracks: z.number().int(), incomplete_rubrics: z.number().int(), draft_exams: z.number().int() }),
    recent_actions: z.array(
      z.object({
        id: z.number().int(),
        action: z.string(),
        label: z.string(),
        actor: z.object({ id: z.number().int(), name: z.string() }).nullable(),
        subject_type: z.string().nullable(),
        subject_id: z.number().int().nullable(),
        created_at: isoDateTime,
      })
    ),
  })
)

/** `GET /admin/users` (nyers paginator, a frontend `Paginated<AdminUser>`-je). */
export const adminUsersResponse = rawPaginator(
  z.object({
    id: z.number().int(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['student', 'admin']),
    email_verified_at: isoDateTime.nullable(),
    registered_at: isoDateTime.nullable(),
    has_premium_access: z.boolean(),
    subscription: z
      .object({ status: z.enum(['active', 'past_due']), current_period_start: isoDateTime.nullable(), current_period_end: isoDateTime.nullable(), grace_ends_at: isoDateTime.nullable(), cancel_at_period_end: z.boolean() })
      .nullable(),
    access_grant: z.object({ id: z.number().int(), reason: z.string(), ends_at: isoDateTime.nullable() }).nullable(),
    progress: z.object({ completed: z.number().int(), total: z.number().int(), percent: z.number() }),
  })
)
