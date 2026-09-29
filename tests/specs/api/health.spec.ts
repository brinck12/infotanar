import { expect, test } from '../../src/fixtures'

test('health végpont ok-ot ad vissza', { tag: '@smoke' }, async ({ apiClient }) => {
  const result = await apiClient.health()

  expect(result.status).toBe(200)
  expect(result.body).toEqual({ ok: true })
})
