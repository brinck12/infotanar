import type { LessonDetail, TaskDetail, TaskListItem, TaskTopic, Topic, TrackDetail, TrackSummary } from '../../api/types'

/**
 * Katalogus-entitasok (temakor, feladat) gyarai. Minden gyar ervenyes,
 * a szerzodesnek megfelelo alapobjektumot ad; a teszt csak azt irja felul,
 * ami az adott eset szempontjabol lenyeges.
 */

export function buildTaskTopic(overrides: Partial<TaskTopic> = {}): TaskTopic {
  return { id: 1, name: 'Programozási tételek', slug: 'programozasi-tetelek', ...overrides }
}

export function buildTopic(overrides: Partial<Topic> = {}): Topic {
  return { ...buildTaskTopic(), task_count: 1, ...overrides }
}

export function buildTaskDetail(overrides: Partial<TaskDetail> = {}): TaskDetail {
  return {
    id: 1,
    title: 'Összegzés tétele',
    description: '## Feladat\n\nAdd össze a beolvasott számokat!',
    level: 'kozep',
    difficulty: 1,
    allowed_languages: ['python', 'csharp'],
    starter_code: { python: 'n = int(input())\n', csharp: 'using System;\n' },
    topic: buildTaskTopic(),
    example_test_cases: [{ id: 1, stdin: '3\n5\n10\n15\n', expected_stdout: '30\n' }],
    hidden_test_case_count: 2,
    ...overrides,
  }
}

/** A lista-nezet a reszletes nezetbol szarmazik, igy a ketto mindig konzisztens. */
export function toTaskListItem(task: TaskDetail): TaskListItem {
  const { id, title, level, difficulty, allowed_languages, topic } = task
  return { id, title, level, difficulty, allowed_languages, topic }
}

/**
 * Egyetlen kepzesi ag a megadott feladatokkal: temakoronkent egy modul, benne
 * feladatonkent egy lecke. A feladatlista ag szerinti csoportositasahoz kell.
 */
export function buildTrackDetail(tasks: TaskDetail[], overrides: Partial<TrackDetail> = {}): TrackDetail {
  const topics = [...new Map(tasks.map((task) => [task.topic.id, task.topic])).values()]

  return {
    id: 1,
    slug: 'programozas',
    title: 'Programozás',
    description: null,
    modules: topics.map((topic) => ({
      id: topic.id,
      slug: topic.slug,
      title: topic.name,
      description: null,
      lessons: tasks
        .filter((task) => task.topic.id === topic.id)
        .map((task) => {
          const { id, title, level, difficulty, allowed_languages } = task
          return {
            id,
            slug: `lecke-${String(id)}`,
            title,
            is_free: true,
            locked: false,
            locked_reason: null,
            has_video: false,
            exercise_count: 1,
            status: null,
            exercises: [{ id, title, level, difficulty, allowed_languages }],
          }
        }),
    })),
    ...overrides,
  }
}

export function toTrackSummary(track: TrackDetail): TrackSummary {
  const { id, slug, title, description, modules } = track
  const lessonCount = modules.reduce((sum, module) => sum + module.lessons.length, 0)
  return { id, slug, title, description, module_count: modules.length, lesson_count: lessonCount, free_lesson_count: lessonCount, progress: null }
}

/** A lecke oldala az ag szerkezetebol, ahogy a vendeg latja; `undefined`, ha nincs ilyen lecke. */
export function toLessonDetail(track: TrackDetail, lessonSlug: string): LessonDetail | undefined {
  const ordered = track.modules.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson })))
  const index = ordered.findIndex(({ lesson }) => lesson.slug === lessonSlug)
  const found = ordered[index]
  if (!found) return undefined

  const link = (item: (typeof ordered)[number] | undefined) => (item ? { slug: item.lesson.slug, title: item.lesson.title } : null)
  const { id, slug, title, is_free, has_video, exercises } = found.lesson

  return {
    id,
    slug,
    title,
    track: { slug: track.slug, title: track.title },
    module: { id: found.module.id, title: found.module.title },
    is_free,
    has_video,
    status: null,
    exercises,
    previous: link(ordered[index - 1]),
    next: link(ordered[index + 1]),
    locked: false,
    content: '## Jegyzet\n\nA lecke rövid összefoglalója.',
  }
}
