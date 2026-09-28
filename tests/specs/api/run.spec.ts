import { ECHO_PROGRAM, JUDGE0_CONTROL, SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'

// Figyelem: a /run es a /submissions kozos throttle:10,1 kvotat hasznal.
// Minden itteni hivas fogyasztja; a kvota kimeriteset kulon projekt
// (api-rate-limit) vegzi, ezek utan.
test.describe('Futtatás (/run)', () => {
  test('a futtatás csak a nem rejtett teszteseteken fut és nem ment beadást', { tag: '@smoke' }, async ({ apiClient }) => {
    const id = await apiClient.taskIdByTitle(SEEDED.tasks.main)

    const result = await apiClient.run({ task_id: id, language: 'python', source_code: ECHO_PROGRAM })
    expect(result.ok).toBe(true)

    const body = result.body
    expect(body.status).toBe('passed')
    expect(body.results).toHaveLength(SEEDED.mainTask.exampleCount)
    expect(body.results.every((r) => !r.hidden)).toBe(true)
    expect(body).not.toHaveProperty('submission_id')
  })

  test('elérhetetlen Judge0 esetén magyar hibaüzenet jön, nem stacktrace', { tag: '@regression' }, async ({ apiClient }) => {
    const id = await apiClient.taskIdByTitle(SEEDED.tasks.main)

    const result = await apiClient.run({
      task_id: id,
      language: 'python',
      source_code: `print("${JUDGE0_CONTROL.forceUnavailable}")`,
    })
    expect(result.ok).toBe(true)

    expect(result.body.status).toBe('error')
    expect(result.body.results[0]?.error).toContain('kódfuttató')
  })

  test.describe('validáció', () => {
    test('nem támogatott nyelv validációs hibát ad', { tag: '@regression' }, async ({ apiClient }) => {
      const id = await apiClient.taskIdByTitle(SEEDED.tasks.main)

      const result = await apiClient.run({ task_id: id, language: 'brainfuck', source_code: 'x' })

      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty('language')
    })

    test('a feladat által nem engedélyezett nyelv elutasított', { tag: '@regression' }, async ({ apiClient }) => {
      const id = await apiClient.taskIdByTitle(SEEDED.tasks.csharpOnly)

      const result = await apiClient.run({ task_id: id, language: 'python', source_code: 'print(1)' })

      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty('language')
    })

    test('üres forráskód validációs hibát ad', { tag: '@regression' }, async ({ apiClient }) => {
      const id = await apiClient.taskIdByTitle(SEEDED.tasks.main)

      const result = await apiClient.run({ task_id: id, language: 'python', source_code: '' })

      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty('source_code')
    })
  })
})
