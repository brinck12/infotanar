/** Katalogus, lecke, feladat es haladas valaszainak semai (frontend: types/index.ts, features/catalog, features/lesson, features/progress). */
import { z } from 'zod'
import { envelope } from './common'

const level = z.enum(['kozep', 'emelt'])
const languageKey = z.enum(['python', 'csharp', 'sql'])
const lockReason = z.enum(['login_required', 'email_unverified', 'subscription_required'])
const lessonStatus = z.enum(['not_started', 'in_progress', 'completed'])
const exerciseStatus = z.enum(['solved', 'attempted'])

const progressSummary = z.object({ completed: z.number().int(), total: z.number().int(), percent: z.number() })

const exerciseSummary = z.object({
  id: z.number().int(),
  title: z.string(),
  level,
  difficulty: z.number().int(),
  allowed_languages: z.array(languageKey),
  my_status: exerciseStatus.nullable().optional(),
})

/** `GET /tracks`. */
export const tracksResponse = envelope(
  z.array(
    z.object({
      id: z.number().int(),
      slug: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      module_count: z.number().int(),
      lesson_count: z.number().int(),
      free_lesson_count: z.number().int(),
      progress: progressSummary.nullable(),
    })
  )
)

const lessonSummary = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  is_free: z.boolean(),
  locked: z.boolean(),
  locked_reason: lockReason.nullable(),
  has_video: z.boolean(),
  exercise_count: z.number().int(),
  status: lessonStatus.nullable(),
  exercises: z.array(exerciseSummary),
})

/** `GET /tracks/{slug}`. */
export const trackResponse = envelope(
  z.object({
    id: z.number().int(),
    slug: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    modules: z.array(
      z.object({ id: z.number().int(), slug: z.string(), title: z.string(), description: z.string().nullable(), lessons: z.array(lessonSummary) })
    ),
  })
)

const lessonLink = z.object({ slug: z.string(), title: z.string() })

const lessonBase = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  track: lessonLink,
  module: z.object({ id: z.number().int(), title: z.string().nullable() }),
  is_free: z.boolean(),
  has_video: z.boolean(),
  status: lessonStatus.nullable(),
  exercises: z.array(exerciseSummary),
  previous: lessonLink.nullable(),
  next: lessonLink.nullable(),
})

/** `GET /tracks/{track}/lessons/{lesson}`: hozzaferheto (tartalommal) vagy zarolt (ok + uzenet, tartalom nelkul). */
export const lessonResponse = envelope(
  z.discriminatedUnion('locked', [
    lessonBase.extend({ locked: z.literal(false), content: z.string() }),
    lessonBase.extend({ locked: z.literal(true), locked_reason: lockReason, locked_message: z.string() }),
  ])
)

const taskLink = z.object({ id: z.number().int(), title: z.string(), lesson_id: z.number().int(), locked: z.boolean() })

const taskBase = z.object({
  id: z.number().int(),
  title: z.string(),
  level,
  difficulty: z.number().int(),
  allowed_languages: z.array(languageKey),
  is_free: z.boolean(),
  topic: z.object({ id: z.number().int(), name: z.string(), slug: z.string() }),
  hidden_test_case_count: z.number().int(),
  lesson: z.object({ id: z.number().int(), slug: z.string(), track_slug: z.string().nullable(), title: z.string(), has_video: z.boolean() }),
  navigation: z.object({
    previous: taskLink.nullable(),
    next: taskLink.nullable(),
    next_lesson: z.object({ slug: z.string(), title: z.string(), locked: z.boolean() }).nullable(),
  }),
  my_status: exerciseStatus.nullable().optional(),
})

const taskFile = z.object({ name: z.string(), size: z.number(), url: z.string() })

const executionLimits = z.object({ time_limit_ms: z.number(), memory_limit_kb: z.number() })

/** `GET /tasks/{task}` (a frontend `TaskDetail`-je): zarolt vagy hozzaferheto, `kind` szerinti kiegeszito blokkokkal. */
export const taskResponse = envelope(
  z.discriminatedUnion('locked', [
    taskBase.extend({ locked: z.literal(true), locked_reason: lockReason, locked_message: z.string() }),
    taskBase.extend({
      locked: z.literal(false),
      kind: z.enum(['code', 'sql', 'sheet_upload', 'sheet_browser', 'doc_upload', 'doc_browser', 'web', 'visual_upload']),
      description: z.string(),
      constraints: z.array(z.string()),
      starter_code: z.record(z.string(), z.string()),
      example_test_cases: z.array(z.object({ id: z.number().int(), stdin: z.string(), expected_stdout: z.string() })),
      limits: z.record(z.string(), executionLimits),
      sources: z.array(taskFile).optional(),
      file_task: z
        .object({
          steps: z.array(z.string()),
          sources: z.array(taskFile),
          deliverable: z.string().nullable(),
          accepted_extensions: z.array(z.string()),
          software: z.array(z.string()),
          sample_image_url: z.string().nullable(),
          exam_reference: z.string().nullable(),
          exam_points: z.number().nullable(),
        })
        .optional(),
      web_task: z
        .object({
          files: z.array(z.object({ name: z.string(), language: z.enum(['html', 'css']), content: z.string() })),
          checks: z.array(z.object({ id: z.number().int(), label: z.string(), points: z.number(), type: z.string() })),
          exam_reference: z.string().nullable(),
        })
        .optional(),
      sheet_practice: z
        .object({
          columns: z.number().int(),
          rows: z.number().int(),
          cells: z.record(z.string(), z.string()),
          checks: z.array(z.object({ id: z.number().int(), label: z.string(), type: z.string() })),
        })
        .optional(),
    }),
  ])
)

/** `GET /tasks` (a lista eleme). */
export const tasksResponse = envelope(
  z.array(
    z.object({
      id: z.number().int(),
      title: z.string(),
      level,
      difficulty: z.number().int(),
      allowed_languages: z.array(languageKey),
      topic: z.object({ id: z.number().int(), name: z.string(), slug: z.string() }),
      is_free: z.boolean().optional(),
      locked: z.boolean().optional(),
      my_status: exerciseStatus.nullable().optional(),
    })
  )
)

/** `GET /topics`. */
export const topicsResponse = envelope(z.array(z.object({ id: z.number().int(), name: z.string(), slug: z.string(), task_count: z.number().int() })))

/** `GET /languages`. */
export const languagesResponse = envelope(
  z.array(z.object({ key: z.string(), label: z.string(), monaco: z.string(), default_limits: executionLimits, time_factor: z.number() }))
)

/** `GET /progress`. */
export const progressResponse = envelope(
  z.object({
    overall: progressSummary,
    tracks: z.array(
      progressSummary.extend({
        id: z.number().int(),
        slug: z.string(),
        title: z.string(),
        lessons: z.array(z.object({ id: z.number().int(), status: lessonStatus })),
      })
    ),
  })
)

/** `POST /lessons/{lesson}/complete`. */
export const completeLessonResponse = envelope(z.object({ lesson_id: z.number().int(), status: lessonStatus }))
