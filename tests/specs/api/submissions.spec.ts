import { ECHO_PROGRAM, JUDGE0_CONTROL, SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'

test.describe('Beadás (/submissions)', () => {
  test(
    'a beadás minden teszteseten fut, elmentődik, és a rejtett kimenet nem szivárog ki',
    { tag: '@smoke' },
    async ({ apiClient }) => {
      const id = await apiClient.taskIdByTitle(SEEDED.tasks.main)

      const result = await apiClient.submit({ task_id: id, language: 'python', source_code: ECHO_PROGRAM })
      expect(result.ok).toBe(true)

      const body = result.body
      expect(body.status).toBe('passed')
      expect(body.results).toHaveLength(SEEDED.mainTask.exampleCount + SEEDED.mainTask.hiddenCount)
      expect(body.submission_id).toBeTruthy()

      const hidden = body.results.find((r) => r.hidden)
      expect(hidden, 'van rejtett teszteset az eredmények között').toBeDefined()
      expect(hidden).not.toHaveProperty('stdout')
      expect(hidden).not.toHaveProperty('expected')
      expect(hidden).not.toHaveProperty('stdin')
    }
  )

  test('rossz kimenet esetén a beadás failed', { tag: '@regression' }, async ({ apiClient }) => {
    const id = await apiClient.taskIdByTitle(SEEDED.tasks.main)

    const result = await apiClient.submit({
      task_id: id,
      language: 'python',
      source_code: `print("${JUDGE0_CONTROL.forceWrong}")`,
    })

    expect(result.ok).toBe(true)
    expect(result.body.status).toBe('failed')
  })
})
