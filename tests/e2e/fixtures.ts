import type { Page } from '@playwright/test'

/**
 * A backend válaszainak mockolása route interceptionnel.
 * Így a Playwright CI-ban élő backend és Judge0 nélkül is fut.
 */

const API = '**/api/v1'

export const TOPICS = [
  { id: 1, name: 'Programozási tételek', slug: 'programozasi-tetelek', task_count: 1 },
]

export const TASK_LIST = [
  {
    id: 1,
    title: 'Összegzés tétele',
    level: 'kozep',
    difficulty: 1,
    allowed_languages: ['python', 'csharp'],
    topic: { id: 1, name: 'Programozási tételek', slug: 'programozasi-tetelek' },
  },
]

export const TASK_DETAIL = {
  id: 1,
  title: 'Összegzés tétele',
  description: '## Feladat\n\nAdd össze a beolvasott számokat!',
  level: 'kozep',
  difficulty: 1,
  allowed_languages: ['python', 'csharp'],
  starter_code: { python: 'n = int(input())\n', csharp: 'using System;\n' },
  topic: { id: 1, name: 'Programozási tételek', slug: 'programozasi-tetelek' },
  example_test_cases: [{ id: 1, stdin: '3\n5\n10\n15\n', expected_stdout: '30\n' }],
  hidden_test_case_count: 2,
}

export const RUN_PASSED = {
  status: 'passed',
  results: [
    {
      test_case_id: 1,
      hidden: false,
      passed: true,
      time: 0.02,
      exit_code: 0,
      judge_status: 'Accepted',
      stdin: '3\n5\n10\n15\n',
      stdout: '30\n',
      expected: '30\n',
      stderr: '',
      compile_output: '',
    },
  ],
}

/** Az olvasó végpontok mockolása (témakörök, feladatlista, feladat). */
export async function mockReadEndpoints(page: Page) {
  await page.route(`${API}/topics`, (route) =>
    route.fulfill({ json: { data: TOPICS } })
  )

  await page.route(`${API}/tasks?*`, (route) =>
    route.fulfill({ json: { data: TASK_LIST } })
  )

  await page.route(`${API}/tasks`, (route) =>
    route.fulfill({ json: { data: TASK_LIST } })
  )

  await page.route(`${API}/tasks/1`, (route) =>
    route.fulfill({ json: { data: TASK_DETAIL } })
  )
}

/** A /run végpont mockolása egy adott válasszal. */
export async function mockRun(page: Page, body: unknown) {
  await page.route(`${API}/run`, (route) => route.fulfill({ json: body }))
}
