import type { TaskDetail, TaskListItem, TaskTopic, Topic } from '../../api/types'

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
