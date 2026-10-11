import type { ApiClient } from '../../src/api/ApiClient'
import {
  ORAL_SELF_CRITERIA,
  ORAL_TOPICS,
  oralPracticeInput,
  oralPractices,
  preferences,
  recordOralAttempt,
  saveOralPractice,
  savePreferences,
  studyPreferences,
} from '../../src/api/areas/learning'
import { registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const [TOPIC, OTHER_TOPIC] = ORAL_TOPICS
const [CRITERION] = ORAL_SELF_CRITERIA

/**
 * Friss diak tokenes kliense. Minden teszt sajatot kap: a mentett allapot igy
 * nem szivarog at tesztek kozott, es a felhasznalonkenti irasi korlat sem fogy ki.
 */
async function student(apiClient: ApiClient): Promise<ApiClient> {
  return (await apiClient.signUp(registration())).client
}

test.describe('Tanulási célok (/account/preferences)', () => {
  test('új felhasználónál a célok értéke null', { tag: '@smoke' }, async ({ apiClient }) => {
    const result = await preferences(await student(apiClient))

    expect(result.status).toBe(200)
    expect(result.body).toEqual({ data: null })
  })

  test('a mentett célokat a mentés és a lekérdezés is visszaadja', { tag: '@smoke' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const goals = studyPreferences()

    const saved = await savePreferences(client, goals)

    expect(saved.status).toBe(200)
    expect(saved.body).toEqual({ data: goals })
    expect((await preferences(client)).body).toEqual({ data: goals })
  })

  test('az újabb mentés felülírja a korábbit', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    await savePreferences(client, studyPreferences())
    const changed = studyPreferences({ level: 'kozep', exam_period: '2028-05', language: 'python', weekly_hours: '1-2' })

    expect((await savePreferences(client, changed)).status).toBe(200)

    expect((await preferences(client)).body.data).toEqual(changed)
  })

  test('a kérésben küldött ismeretlen mezők nem kerülnek a mentett célok közé', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const goals = studyPreferences()

    const saved = await savePreferences(client, { ...goals, role: 'admin', theme: 'dark' })

    expect(saved.body.data).toEqual(goals)
    expect((await preferences(client)).body.data).toEqual(goals)
  })

  for (const [field, value] of [
    ['level', 'halado'],
    ['exam_period', '2020-05'],
    ['language', 'java'],
    ['weekly_hours', '10'],
  ] as const) {
    test(`érvénytelen ${field} 422, és semmi nem mentődik`, { tag: '@regression' }, async ({ apiClient }) => {
      const client = await student(apiClient)

      const result = await savePreferences(client, { ...studyPreferences(), [field]: value })

      expect(result.status).toBe(422)
      expect(Object.keys(result.errorBody.errors)).toEqual([field])
      expect((await preferences(client)).body.data).toBeNull()
    })
  }

  for (const field of ['level', 'exam_period', 'language', 'weekly_hours'] as const) {
    test(`hiányzó ${field} 422`, { tag: '@regression' }, async ({ apiClient }) => {
      const client = await student(apiClient)
      const { [field]: _omitted, ...incomplete } = studyPreferences()

      const result = await savePreferences(client, incomplete)

      expect(result.status).toBe(422)
      expect(Object.keys(result.errorBody.errors)).toEqual([field])
    })
  }

  test('bejelentkezés nélkül 401', { tag: '@regression' }, async ({ apiClient }) => {
    expect((await preferences(apiClient)).status).toBe(401)
    expect((await savePreferences(apiClient, studyPreferences())).status).toBe(401)
  })

  test('két felhasználó céljai függetlenek egymástól', { tag: '@regression' }, async ({ apiClient }) => {
    const first = await student(apiClient)
    const second = await student(apiClient)
    const firstGoals = studyPreferences({ level: 'emelt', language: 'csharp' })
    const secondGoals = studyPreferences({ level: 'kozep', language: 'python' })

    await savePreferences(first, firstGoals)
    expect((await preferences(second)).body.data).toBeNull()

    await savePreferences(second, secondGoals)
    expect((await preferences(first)).body.data).toEqual(firstGoals)
    expect((await preferences(second)).body.data).toEqual(secondGoals)
  })

  test('percenként 30 mentés után 429, de a korlát nem fogyasztja más végpontok keretét', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const goals = studyPreferences()

    for (let attempt = 1; attempt <= 30; attempt++) {
      expect((await savePreferences(client, goals)).status, `${String(attempt)}. mentés`).toBe(200)
    }
    expect((await savePreferences(client, goals)).status).toBe(429)

    // A profilmodositas kerete percenkent 10: ha a ket vegpont kozos szamlalot
    // novelne, a fenti 31 keres utan ez is 429 volna.
    expect((await client.patch('account/profile', { name: 'Teszt Elek' })).status).toBe(200)
  })
})

test.describe('Szóbeli gyakorlás (/oral/practice)', () => {
  test('új felhasználónál a lista üres', { tag: '@smoke' }, async ({ apiClient }) => {
    const result = await oralPractices(await student(apiClient))

    expect(result.status).toBe(200)
    expect(result.body).toEqual({ data: [] })
  })

  test('az első mentés létrehozza a témakör állapotát', { tag: '@smoke' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const input = oralPracticeInput()

    const saved = await saveOralPractice(client, TOPIC, input)

    const expected = { topic: TOPIC, ...input, attempts: 0, last_practiced_at: null }
    expect(saved.status).toBe(200)
    expect(saved.body).toEqual({ data: expected })
    expect((await oralPractices(client)).body).toEqual({ data: [expected] })
  })

  test('a második mentés a teljes állapotot felülírja, új sor nélkül', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    await saveOralPractice(client, TOPIC, oralPracticeInput())
    const changed = oralPracticeInput({
      checked: [5, 1, 29],
      notes: 'Második változat.',
      scores: { [ORAL_SELF_CRITERIA[1]]: 4, [ORAL_SELF_CRITERIA[2]]: 0 },
    })

    const saved = await saveOralPractice(client, TOPIC, changed)

    expect(saved.status).toBe(200)
    expect(saved.body.data).toEqual({ topic: TOPIC, ...changed, attempts: 0, last_practiced_at: null })
    expect((await oralPractices(client)).body.data).toEqual([saved.body.data])
  })

  test('az üres állapot is menthető, és az üres önértékelés objektumként jön vissza', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    await saveOralPractice(client, TOPIC, oralPracticeInput())

    const cleared = await saveOralPractice(client, TOPIC, { checked: [], notes: '', scores: {} })

    expect(cleared.status).toBe(200)
    expect(cleared.body.data).toEqual({ topic: TOPIC, checked: [], notes: '', scores: {}, attempts: 0, last_practiced_at: null })
    // A JSON-ban `{}` kell, nem `[]`: a frontend szempontnev szerint indexeli.
    const [listed] = (await oralPractices(client)).body.data
    expect(Array.isArray(listed?.scores)).toBe(false)
    expect(Array.isArray(listed?.checked)).toBe(true)
  })

  test('a témakörök állapota külön sorokban él', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const first = oralPracticeInput({ notes: 'Első témakör.' })
    const second = oralPracticeInput({ checked: [7], notes: 'Második témakör.', scores: {} })

    await saveOralPractice(client, TOPIC, first)
    await saveOralPractice(client, OTHER_TOPIC, second)

    const { data } = (await oralPractices(client)).body
    expect(data.map((practice) => practice.topic)).toEqual([TOPIC, OTHER_TOPIC])
    expect(data.map((practice) => practice.notes)).toEqual([first.notes, second.notes])
  })

  test('ismeretlen témakör 404, és nem jön létre sor', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)

    expect((await saveOralPractice(client, 'halozatok', oralPracticeInput())).status).toBe(404)
    expect((await recordOralAttempt(client, 'halozatok')).status).toBe(404)
    expect((await oralPractices(client)).body.data).toEqual([])
  })

  for (const { name, payload, field } of [
    { name: 'ismeretlen önértékelési szempont', payload: { scores: { 'Tartalom, A) feladat': 3 } }, field: 'scores' },
    { name: 'önértékelés listaként', payload: { scores: [3, 4] }, field: 'scores' },
    { name: '5 pontos önértékelés', payload: { scores: { [CRITERION]: 5 } }, field: `scores.${CRITERION}` },
    { name: '-1 pontos önértékelés', payload: { scores: { [CRITERION]: -1 } }, field: `scores.${CRITERION}` },
    { name: 'tört pontszám', payload: { scores: { [CRITERION]: 2.5 } }, field: `scores.${CRITERION}` },
    { name: 'a 30-as vázlatpont', payload: { checked: [0, 30] }, field: 'checked.1' },
    { name: 'negatív vázlatpont', payload: { checked: [-1] }, field: 'checked.0' },
    { name: 'kétszer kipipált vázlatpont', payload: { checked: [4, 4] }, field: 'checked.0' },
    { name: 'harmincnál több kipipált pont', payload: { checked: Array.from({ length: 31 }, (_, index) => index % 30) }, field: 'checked' },
    { name: 'nem lista a kipipált pontok helyén', payload: { checked: { a: 1 } }, field: 'checked' },
    { name: '5001 karakteres jegyzet', payload: { notes: 'a'.repeat(5001) }, field: 'notes' },
    { name: 'nem szöveges jegyzet', payload: { notes: ['a'] }, field: 'notes' },
  ]) {
    test(`${name} 422, és semmi nem mentődik`, { tag: '@regression' }, async ({ apiClient }) => {
      const client = await student(apiClient)

      const result = await saveOralPractice(client, TOPIC, { ...oralPracticeInput(), ...payload })

      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty([field])
      expect((await oralPractices(client)).body.data).toEqual([])
    })
  }

  for (const field of ['checked', 'notes', 'scores'] as const) {
    test(`hiányzó ${field} 422`, { tag: '@regression' }, async ({ apiClient }) => {
      const client = await student(apiClient)
      const { [field]: _omitted, ...incomplete } = oralPracticeInput()

      const result = await saveOralPractice(client, TOPIC, incomplete)

      expect(result.status).toBe(422)
      expect(Object.keys(result.errorBody.errors)).toEqual([field])
    })
  }

  test('a határértékek még érvényesek: 29-es pont, 4 pont, 5000 karakter', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const input = {
      checked: Array.from({ length: 30 }, (_, index) => index),
      notes: 'á'.repeat(5000),
      scores: Object.fromEntries(ORAL_SELF_CRITERIA.map((criterion) => [criterion, 4])),
    }

    const saved = await saveOralPractice(client, TOPIC, input)

    expect(saved.status).toBe(200)
    expect(saved.body.data).toMatchObject(input)
  })

  test('a gyakorlás rögzítése létrehozza a sort, növeli a számlálót és beállítja az időpontot', { tag: '@smoke' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const startedAt = Date.now()

    const first = await recordOralAttempt(client, TOPIC)

    expect(first.status).toBe(200)
    expect(first.body.data).toMatchObject({ topic: TOPIC, checked: [], notes: '', scores: {}, attempts: 1 })
    const firstPracticedAt = Date.parse(first.body.data.last_practiced_at ?? '')
    // Az idobelyeg masodperc pontossagu, ezert a kezdes elotti masodperc is belefer.
    expect(firstPracticedAt).toBeGreaterThanOrEqual(startedAt - 1000)
    expect(firstPracticedAt).toBeLessThanOrEqual(Date.now() + 1000)

    const second = await recordOralAttempt(client, TOPIC)

    expect(second.body.data.attempts).toBe(2)
    expect(Date.parse(second.body.data.last_practiced_at ?? '')).toBeGreaterThanOrEqual(firstPracticedAt)
    expect((await oralPractices(client)).body.data).toEqual([second.body.data])
  })

  test('a mentés nem nullázza a számlálót, a gyakorlás rögzítése nem bántja a mentett állapotot', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const input = oralPracticeInput()
    await saveOralPractice(client, TOPIC, input)

    const attempted = await recordOralAttempt(client, TOPIC)
    expect(attempted.body.data).toMatchObject({ ...input, attempts: 1 })

    const saved = await saveOralPractice(client, TOPIC, oralPracticeInput({ notes: 'Gyakorlás után.' }))
    expect(saved.body.data.attempts).toBe(1)
    expect(saved.body.data.last_practiced_at).toBe(attempted.body.data.last_practiced_at)
  })

  test('bejelentkezés nélkül 401', { tag: '@regression' }, async ({ apiClient }) => {
    expect((await oralPractices(apiClient)).status).toBe(401)
    expect((await saveOralPractice(apiClient, TOPIC, oralPracticeInput())).status).toBe(401)
    expect((await recordOralAttempt(apiClient, TOPIC)).status).toBe(401)
  })

  test('két felhasználó állapota független egymástól', { tag: '@regression' }, async ({ apiClient }) => {
    const first = await student(apiClient)
    const second = await student(apiClient)
    const firstInput = oralPracticeInput({ notes: 'Az első diák jegyzete.' })

    await saveOralPractice(first, TOPIC, firstInput)
    await recordOralAttempt(first, TOPIC)
    expect((await oralPractices(second)).body.data).toEqual([])

    const secondSaved = await saveOralPractice(second, TOPIC, oralPracticeInput({ checked: [], notes: 'A második diáké.', scores: {} }))

    expect(secondSaved.body.data).toMatchObject({ notes: 'A második diáké.', attempts: 0, last_practiced_at: null })
    expect((await oralPractices(first)).body.data).toMatchObject([{ ...firstInput, attempts: 1 }])
  })
})
