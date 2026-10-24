import type { ApiClient } from '../../src/api/ApiClient'
import { savePreferences, studyPreferences } from '../../src/api/areas/learning'
import { weeklyRhythm } from '../../src/api/areas/rhythm'
import { ECHO_PROGRAM, JUDGE0_CONTROL, registration, SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'
import { plantLessonCompletion } from '../../src/support/artisan'

/**
 * Heti ritmus (GET /progress/rhythm): a hét hét napja hétfőtől vasárnapig, magyar idő szerint; tanulási nap
 * egy lecketeljesítés vagy egy feladatbeadás. Szándékosan nincs benne szám, széria vagy lemaradás.
 *
 * A határokat a "mostani magyar hét hétfő 00:00-jától" számolt percekkel írt sorokkal próbáljuk
 * (src/support/artisan.ts `plantLessonCompletion`). Ha egy futás épp a hétváltáskor (vasárnap éjfél) esik,
 * a teszt újrafuttatandó: a hét a két hívás között átfordulhat.
 */

const MINUTES_PER_DAY = 24 * 60
const WEEK_MINUTES = 7 * MINUTES_PER_DAY

async function student(apiClient: ApiClient): Promise<{ client: ApiClient; id: number }> {
  const account = await apiClient.signUp(registration())
  return { client: account.client, id: account.user.id }
}

async function activeIndexes(client: ApiClient): Promise<number[]> {
  const { body } = await weeklyRhythm(client)
  return body.data.days.flatMap((day, index) => (day.active ? [index] : []))
}

test.describe('Heti ritmus (GET /progress/rhythm)', () => {
  test('bejelentkezés nélkül 401', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await weeklyRhythm(apiClient)

    expect(result.status).toBe(401)
  })

  test('az új felhasználó hete üres: hét egymást követő nap hétfőtől, nincs cél, nem érte el', { tag: '@smoke' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)

    const result = await weeklyRhythm(client)

    expect(result.status).toBe(200)
    const rhythm = result.body.data
    expect(rhythm.days).toHaveLength(7)
    expect(rhythm.days.map((day) => day.active)).toEqual(Array<boolean>(7).fill(false))
    expect(rhythm.week_start).toBe(rhythm.days[0]?.date)
    expect(new Date(`${rhythm.week_start}T12:00:00Z`).getUTCDay(), 'a hét hétfőn kezdődik').toBe(1)
    rhythm.days.forEach((day, index) => {
      expect(day.date).toBe(new Date(Date.parse(`${rhythm.week_start}T12:00:00Z`) + index * MINUTES_PER_DAY * 60_000).toISOString().slice(0, 10))
    })
    expect(rhythm.days.map((day) => day.date)).toContain(rhythm.today)
    expect(rhythm.goal_days).toBeNull()
    expect(rhythm.goal_reached).toBe(false)
  })

  test('a válaszban nincs szám, széria vagy lemaradás: csak a hét napjai és a (halk) cél', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)

    const { body } = await weeklyRhythm(client)

    expect(Object.keys(body.data).sort()).toEqual(['days', 'goal_days', 'goal_reached', 'today', 'week_start'])
    expect(Object.keys(body.data.days[0] ?? {}).sort()).toEqual(['active', 'date'])
  })

  test('a lecketeljesítés az adott napot tanulási nappá teszi, a többit nem', { tag: '@smoke' }, async ({ apiClient }) => {
    const { client, id } = await student(apiClient)
    const { body } = await weeklyRhythm(client)
    const todayIndex = body.data.days.findIndex((day) => day.date === body.data.today)

    plantLessonCompletion(id, todayIndex * MINUTES_PER_DAY + 12 * 60)

    expect(await activeIndexes(client)).toEqual([todayIndex])
  })

  test('a feladatbeadás is tanulási nap, akkor is, ha a megoldás hibás', { tag: '@smoke' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)
    const taskId = await apiClient.taskIdByTitle(SEEDED.tasks.main)
    const { body } = await weeklyRhythm(client)
    const todayIndex = body.data.days.findIndex((day) => day.date === body.data.today)

    const submitted = await client.submit({ task_id: taskId, language: 'python', source_code: `${ECHO_PROGRAM}\n# ${JUDGE0_CONTROL.forceWrong}` })

    expect(submitted.body.status).toBe('failed')
    expect(await activeIndexes(client)).toEqual([todayIndex])
  })

  test('a gyakorló futtatás (nem beadás) nem számít tanulási napnak', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await student(apiClient)
    const taskId = await apiClient.taskIdByTitle(SEEDED.tasks.main)

    const run = await client.run({ task_id: taskId, language: 'python', source_code: ECHO_PROGRAM })

    expect(run.ok).toBe(true)
    expect(await activeIndexes(client)).toEqual([])
  })

  test('a napok határa magyar idő szerint van: hétfő 00:30 és vasárnap 23:30 a hét szélső napja, a szomszéd hetek nem számítanak', { tag: '@smoke' }, async ({ apiClient }) => {
    const { client, id } = await student(apiClient)

    plantLessonCompletion(id, 30)
    plantLessonCompletion(id, WEEK_MINUTES - 30)
    plantLessonCompletion(id, -30)
    plantLessonCompletion(id, WEEK_MINUTES + 30)

    expect(await activeIndexes(client)).toEqual([0, 6])
  })

  test('ugyanazon a napon több tevékenység is csak egy tanulási nap', { tag: '@regression' }, async ({ apiClient }) => {
    const { client, id } = await student(apiClient)

    plantLessonCompletion(id, 100)
    plantLessonCompletion(id, 200)
    plantLessonCompletion(id, MINUTES_PER_DAY + 100)

    expect(await activeIndexes(client)).toEqual([0, 1])
  })

  test('más felhasználó tevékenysége nem látszik', { tag: '@regression' }, async ({ apiClient }) => {
    const active = await student(apiClient)
    const quiet = await student(apiClient)

    plantLessonCompletion(active.id, 30)

    expect(await activeIndexes(active.client)).toEqual([0])
    expect(await activeIndexes(quiet.client)).toEqual([])
  })
})

test.describe('Heti ritmus: a halk cél', () => {
  const GOALS = [
    ['1-2', 2],
    ['3-4', 3],
    ['5+', 4],
  ] as const

  for (const [hours, days] of GOALS) {
    test(`a heti óraszám (${hours}) ${String(days)} aktív napot jelent`, { tag: '@regression' }, async ({ apiClient }) => {
      const { client } = await student(apiClient)
      expect((await savePreferences(client, studyPreferences({ weekly_hours: hours }))).status).toBe(200)

      const { body } = await weeklyRhythm(client)

      expect(body.data.goal_days).toBe(days)
      expect(body.data.goal_reached).toBe(false)
    })
  }

  test('a cél a megfelelő számú aktív nappal teljesül, eggyel kevesebbel nem', { tag: '@smoke' }, async ({ apiClient }) => {
    const { client, id } = await student(apiClient)
    await savePreferences(client, studyPreferences({ weekly_hours: '1-2' }))

    plantLessonCompletion(id, 30)
    expect((await weeklyRhythm(client)).body.data.goal_reached, 'egy nap a kettőből').toBe(false)

    plantLessonCompletion(id, MINUTES_PER_DAY + 30)
    expect((await weeklyRhythm(client)).body.data.goal_reached, 'két nap a kettőből').toBe(true)
  })

  test('megadott óraszám nélkül nincs cél, és sosem „teljesül”', { tag: '@regression' }, async ({ apiClient }) => {
    const { client, id } = await student(apiClient)
    for (let day = 0; day < 5; day++) plantLessonCompletion(id, day * MINUTES_PER_DAY + 30)

    const { body } = await weeklyRhythm(client)

    expect(body.data.days.filter((day) => day.active)).toHaveLength(5)
    expect(body.data.goal_days).toBeNull()
    expect(body.data.goal_reached).toBe(false)
  })
})
