/** Kodfuttatas, beadas es fajlbeadas valaszainak semai (frontend: types/index.ts, features/filetasks/api.ts). */
import { z } from 'zod'
import { cursorResource, envelope, isoDateTime } from './common'

const verdict = z.enum(['accepted', 'wrong_answer', 'time_limit_exceeded', 'compilation_error', 'runtime_error', 'constraint_violation', 'system_error'])
const runStatus = z.enum(['passed', 'failed', 'error'])
const languageKey = z.enum(['python', 'csharp', 'sql'])

/** Rejtett teszteset eseten a kimeneti mezok hianyoznak (HiddenResultRedactor). */
const testResult = z.object({
  test_case_id: z.number().int(),
  hidden: z.boolean(),
  passed: z.boolean(),
  verdict,
  verdict_label: z.string(),
  time: z.number().nullable(),
  exit_code: z.number().nullable(),
  judge_status: z.string(),
  stdin: z.string().optional(),
  stdout: z.string().optional(),
  expected: z.string().optional(),
  stderr: z.string().optional(),
  compile_output: z.string().optional(),
  error: z.string().optional(),
  // A backend kuldi (lasd a driftlistat), a frontend TestResult tipusa nem ismeri.
  difference: z.string().optional(),
})

const subtaskScore = z.object({ label: z.string(), points: z.number(), max_points: z.number(), passed: z.boolean(), note: z.string().nullable().optional() })

/** `POST /run` (nincs boritek). */
export const runResponse = z.object({
  status: runStatus,
  verdict,
  verdict_label: z.string(),
  violations: z.array(z.string()).optional(),
  results: z.array(testResult),
  subtasks: z.array(subtaskScore).optional(),
  message: z.string().optional(),
})

/** `POST /submissions`. */
export const submissionResponse = runResponse.extend({ submission_id: z.number().int(), lesson_completed: z.boolean().optional() })

const submissionSummary = z.object({
  id: z.number().int(),
  exercise: z.object({ id: z.number().int(), title: z.string() }).optional(),
  language: languageKey,
  status: z.enum(['passed', 'failed', 'error', 'pending', 'running']),
  verdict: verdict.nullable(),
  verdict_label: z.string().nullable(),
  passed_count: z.number().int(),
  total_count: z.number().int(),
  created_at: isoDateTime,
})

/** `GET /submissions` es `GET /tasks/{task}/submissions` (kurzoros lapozas). */
export const submissionsResponse = cursorResource(submissionSummary)

/** `GET /submissions/{submission}`. */
export const submissionDetailResponse = envelope(submissionSummary.extend({ source_code: z.string(), results: z.array(testResult) }))

/** `POST /exercises/{exercise}/file-submissions` es `GET /file-submissions/{submission}`. */
export const fileSubmissionResponse = envelope(
  z.object({
    id: z.number().int(),
    exercise_id: z.number().int(),
    exercise_title: z.string(),
    attempt: z.number().int(),
    status: z.enum(['processing', 'evaluated', 'failed']),
    score: z.number(),
    max_score: z.number(),
    previous_score: z.number().nullable(),
    file: z.object({ name: z.string(), size: z.number(), uploaded_at: isoDateTime }),
    groups: z.array(z.object({ name: z.string(), score: z.number(), max_score: z.number() })),
    items: z.array(
      z.object({
        rubric_item_id: z.number().int(),
        group: z.string(),
        label: z.string(),
        state: z.string(),
        points: z.number(),
        max_points: z.number(),
        found: z.string().nullable(),
        hint: z.string().nullable(),
        manual_mark: z.boolean().nullable(),
      })
    ),
    facts: z.array(z.object({ label: z.string(), value: z.string() })),
    preview_url: z.string().nullable(),
    sample_url: z.string().nullable(),
    error: z.string().nullable(),
  })
)
