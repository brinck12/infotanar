import { SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'

test.describe('Témakörök', () => {
  test('topics végpont csak a publikált feladatokat számolja', { tag: '@smoke' }, async ({ apiClient }) => {
    const result = await apiClient.topics()
    expect(result.ok).toBe(true)

    const topic = result.body.data.find((t) => t.slug === SEEDED.topic.slug)
    expect(topic, 'a fixture témakör létezik').toBeDefined()
    // 4 fixture feladatból 1 nem publikált -> 3.
    expect(topic?.task_count).toBe(SEEDED.topic.publishedTaskCount)
  })
})

test.describe('Feladatlista', () => {
  test('a feladatlista nem adja vissza a leírást és a nem publikált feladatot', { tag: '@smoke' }, async ({ apiClient }) => {
    const result = await apiClient.tasks()
    expect(result.ok).toBe(true)

    const titles = result.body.data.map((t) => t.title)
    expect(titles).toContain(SEEDED.tasks.main)
    expect(titles).not.toContain(SEEDED.tasks.unpublished)
    for (const item of result.body.data) {
      expect(item).not.toHaveProperty('description')
    }
  })

  test('a feladatlista szint szerint szűrhető', { tag: '@regression' }, async ({ apiClient }) => {
    const emelt = await apiClient.tasks({ level: 'emelt' })
    expect(emelt.body.data.map((t) => t.title)).toEqual([SEEDED.tasks.advanced])

    const kozep = await apiClient.tasks({ level: 'kozep' })
    const kozepTitles = kozep.body.data.map((t) => t.title)
    expect(kozepTitles).toContain(SEEDED.tasks.main)
    expect(kozepTitles).toContain(SEEDED.tasks.csharpOnly)
    expect(kozepTitles).not.toContain(SEEDED.tasks.advanced)
  })
})

test.describe('Feladat részletei', () => {
  test('nem publikált feladat részletei 404-et adnak', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await apiClient.task(SEEDED.unpublishedTaskId)
    expect(result.status).toBe(404)
  })

  test('a feladat részletei csak a nem rejtett teszteseteket adják vissza', { tag: '@regression' }, async ({ apiClient }) => {
    const id = await apiClient.taskIdByTitle(SEEDED.tasks.main)

    const result = await apiClient.task(id)
    expect(result.ok).toBe(true)

    const { data } = result.body
    expect(data.example_test_cases).toHaveLength(SEEDED.mainTask.exampleCount)
    expect(data.hidden_test_case_count).toBe(SEEDED.mainTask.hiddenCount)
    expect(data.starter_code.python).toBe(SEEDED.mainTask.pythonStarter)
  })
})
