import type { TaskDetail, TaskListItem, TaskTopic, Topic, TrackDetail, TrackSummary } from '../../api/types'

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
          return { id, slug: `lecke-${String(id)}`, title, is_free: true, exercises: [{ id, title, level, difficulty, allowed_languages }] }
        }),
    })),
    ...overrides,
  }
}

export function toTrackSummary(track: TrackDetail): TrackSummary {
  const { id, slug, title, description, modules } = track
  return { id, slug, title, description, lesson_count: modules.reduce((sum, module) => sum + module.lessons.length, 0) }
}
