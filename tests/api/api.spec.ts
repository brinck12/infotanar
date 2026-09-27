import { expect, test, type APIRequestContext } from '@playwright/test'

/**
 * A fixture adatokat a backend/database/seeders/ApiTestSeeder.php hozza
 * letre migrate:fresh utan (lasd playwright.config.ts webServer). A nem
 * publikus feladat azonositoja (2) szandekosan rogzitett, mert az sosem
 * jelenik meg listaban, igy nem kereshetunk ra cimmel.
 */
const TASK = {
  main: 'PW teszt: Összegzés',
  unpublishedId: 2,
  csharpOnly: 'PW teszt: Csak C# feladat',
  advanced: 'PW teszt: Emelt szintű feladat',
}

type TaskListItem = { id: number; title: string; level: string }

async function findTaskId(request: APIRequestContext, title: string): Promise<number> {
  const response = await request.get('tasks')
  const body = await response.json()
  const found = (body.data as TaskListItem[]).find((t) => t.title === title)
  if (!found) throw new Error(`Fixture feladat nem talalhato: ${title}`)
  return found.id
}

test.describe.configure({ mode: 'serial' })

test('health végpont ok-ot ad vissza', async ({ request }) => {
  const response = await request.get('health')
  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({ ok: true })
})

test('topics végpont csak a publikált feladatokat számolja', async ({ request }) => {
  const response = await request.get('topics')
  expect(response.ok()).toBeTruthy()

  const body = await response.json()
  const topic = (body.data as Array<{ slug: string; task_count: number }>).find(
    (t) => t.slug === 'pw-teszt-temakor'
  )

  expect(topic).toBeTruthy()
  // 4 fixture feladatból 1 nem publikált -> 3.
  expect(topic?.task_count).toBe(3)
})

test('a feladatlista nem adja vissza a leírást és a nem publikált feladatot', async ({ request }) => {
  const response = await request.get('tasks')
  expect(response.ok()).toBeTruthy()

  const body = await response.json()
  const items = body.data as Array<Record<string, unknown>>

  expect(items.some((t) => t.title === TASK.main)).toBe(true)
  expect(items.some((t) => t.title === 'PW teszt: Nem publikus feladat')).toBe(false)
  for (const item of items) {
    expect(item).not.toHaveProperty('description')
  }
})

test('a feladatlista szint szerint szűrhető', async ({ request }) => {
  const emelt = await request.get('tasks?level=emelt')
  const emeltBody = await emelt.json()
  expect((emeltBody.data as TaskListItem[]).map((t) => t.title)).toEqual([TASK.advanced])

  const kozep = await request.get('tasks?level=kozep')
  const kozepBody = await kozep.json()
  const kozepTitles = (kozepBody.data as TaskListItem[]).map((t) => t.title)
  expect(kozepTitles).toContain(TASK.main)
  expect(kozepTitles).toContain(TASK.csharpOnly)
  expect(kozepTitles).not.toContain(TASK.advanced)
})

test('nem publikált feladat részletei 404-et adnak', async ({ request }) => {
  const response = await request.get(`tasks/${TASK.unpublishedId}`)
  expect(response.status()).toBe(404)
})

test('a feladat részletei csak a nem rejtett teszteseteket adják vissza', async ({ request }) => {
  const id = await findTaskId(request, TASK.main)
  const response = await request.get(`tasks/${id}`)
  expect(response.ok()).toBeTruthy()

  const { data } = await response.json()
  expect(data.example_test_cases).toHaveLength(2)
  expect(data.hidden_test_case_count).toBe(2)
  expect(data.starter_code.python).toBe('print()\n')
})

test('a futtatás csak a nem rejtett teszteseteken fut és nem ment beadást', async ({ request }) => {
  const id = await findTaskId(request, TASK.main)

  const response = await request.post('run', {
    data: { task_id: id, language: 'python', source_code: 'print(input())' },
  })
  expect(response.ok()).toBeTruthy()

  const body = await response.json()
  expect(body.status).toBe('passed')
  expect(body.results).toHaveLength(2)
  expect(body.results.every((r: { hidden: boolean }) => r.hidden === false)).toBe(true)
  expect(body).not.toHaveProperty('submission_id')
})

test('a beadás minden teszteseten fut, elmentődik, és a rejtett kimenet nem szivárog ki', async ({
  request,
}) => {
  const id = await findTaskId(request, TASK.main)

  const response = await request.post('submissions', {
    data: { task_id: id, language: 'python', source_code: 'print(input())' },
  })
  expect(response.ok()).toBeTruthy()

  const body = await response.json()
  expect(body.status).toBe('passed')
  expect(body.results).toHaveLength(4)
  expect(body.submission_id).toBeTruthy()

  const hidden = body.results.find((r: { hidden: boolean }) => r.hidden === true)
  expect(hidden).toBeTruthy()
  expect(hidden).not.toHaveProperty('stdout')
  expect(hidden).not.toHaveProperty('expected')
  expect(hidden).not.toHaveProperty('stdin')
})

test('rossz kimenet esetén a beadás failed', async ({ request }) => {
  const id = await findTaskId(request, TASK.main)

  const response = await request.post('submissions', {
    data: { task_id: id, language: 'python', source_code: 'print("PW_JUDGE0_FORCE_WRONG")' },
  })
  expect(response.ok()).toBeTruthy()
  expect((await response.json()).status).toBe('failed')
})

test('elérhetetlen Judge0 esetén magyar hibaüzenet jön, nem stacktrace', async ({ request }) => {
  const id = await findTaskId(request, TASK.main)

  const response = await request.post('run', {
    data: { task_id: id, language: 'python', source_code: 'print("PW_JUDGE0_FORCE_UNAVAILABLE")' },
  })
  expect(response.ok()).toBeTruthy()

  const body = await response.json()
  expect(body.status).toBe('error')
  expect(body.results[0].error).toContain('kódfuttató')
})

test('nem támogatott nyelv validációs hibát ad', async ({ request }) => {
  const id = await findTaskId(request, TASK.main)

  const response = await request.post('run', {
    data: { task_id: id, language: 'brainfuck', source_code: 'x' },
  })
  expect(response.status()).toBe(422)
  expect((await response.json()).errors).toHaveProperty('language')
})

test('a feladat által nem engedélyezett nyelv elutasított', async ({ request }) => {
  const id = await findTaskId(request, TASK.csharpOnly)

  const response = await request.post('run', {
    data: { task_id: id, language: 'python', source_code: 'print(1)' },
  })
  expect(response.status()).toBe(422)
  expect((await response.json()).errors).toHaveProperty('language')
})

test('üres forráskód validációs hibát ad', async ({ request }) => {
  const id = await findTaskId(request, TASK.main)

  const response = await request.post('run', {
    data: { task_id: id, language: 'python', source_code: '' },
  })
  expect(response.status()).toBe(422)
  expect((await response.json()).errors).toHaveProperty('source_code')
})

// Ez fusson utolsóként: a /run és /submissions közös throttle:10,1
// middleware-t használ, a korábbi tesztek is ugyanazt a kvótát fogyasztják.
test('a futtatás és a beadás IP-nkénti rate limitnek van alávetve', async ({ request }) => {
  const id = await findTaskId(request, TASK.main)
  const payload = { task_id: id, language: 'python', source_code: 'print(input())' }

  let sawTooManyRequests = false

  for (let i = 0; i < 15; i++) {
    const response = await request.post('run', { data: payload })
    if (response.status() === 429) {
      sawTooManyRequests = true
      break
    }
  }

  expect(sawTooManyRequests).toBe(true)
})
