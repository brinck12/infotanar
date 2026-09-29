import { ECHO_PROGRAM, SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'

/**
 * Az "api-rate-limit" projektben fut, az "api" projekt UTAN: a /run es a
 * /submissions kozos throttle:10,1 middleware-t hasznal, igy ez a teszt a
 * tobbi API teszt kvotajat is elfogyasztana.
 */
test('a futtatás és a beadás IP-nkénti rate limitnek van alávetve', { tag: '@regression' }, async ({ apiClient }) => {
  const id = await apiClient.taskIdByTitle(SEEDED.tasks.main)
  const payload = { task_id: id, language: 'python', source_code: ECHO_PROGRAM } as const

  // A kvota 10 kerelem/perc; 15 kerelembol legalabb egynek 429-et kell kapnia.
  const statuses: number[] = []
  for (let i = 0; i < 15; i++) {
    statuses.push((await apiClient.run(payload)).status)
  }

  expect(statuses).toContain(429)
})
