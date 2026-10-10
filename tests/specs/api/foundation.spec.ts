import { adminAccount, premiumStudent, verifiedStudent } from '../../src/api/areas/accounts'
import { fixtureFile, FIXTURE_FILES, SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'

/** A tipusos fixture feladatok cimei, azonosito szerint (5..9). */
const TYPED_TITLES = [
  SEEDED.typed.sheetUpload.title,
  SEEDED.typed.docUpload.title,
  SEEDED.typed.web.title,
  SEEDED.typed.subtasks.title,
  SEEDED.typed.sheetBrowser.title,
]

test.describe('Alapozás: a régi fixture-ök változatlanok', () => {
  test('a régi témakör feladatszáma és az emelt szintű szűrés nem változott', { tag: '@smoke' }, async ({ apiClient }) => {
    const topics = await apiClient.topics()
    expect(topics.ok).toBe(true)
    expect(topics.body.data.find((topic) => topic.slug === SEEDED.topic.slug)?.task_count).toBe(SEEDED.topic.publishedTaskCount)

    // Az új fixture-ök mind középszintűek: az emelt szűrő továbbra is egyetlen feladatot ad.
    const emelt = await apiClient.tasks({ level: 'emelt' })
    expect(emelt.body.data.map((task) => task.title)).toEqual([SEEDED.tasks.advanced])
  })

  test('a régi feladatok azonosítója és típusa megmaradt', { tag: '@regression' }, async ({ apiClient }) => {
    const { body } = await apiClient.tasks({ topic: SEEDED.topic.slug })

    expect(body.data.map((task) => task.id).sort((a, b) => a - b)).toEqual([1, 3, 4])
    expect(body.data.find((task) => task.id === 1)?.title).toBe(SEEDED.tasks.main)
    expect((await apiClient.task(SEEDED.unpublishedTaskId)).status).toBe(404)
  })
})

test.describe('Alapozás: típusos fixture-ök', () => {
  test('a feladatlista tartalmazza az öt új feladatot a rögzített azonosítókkal', { tag: '@smoke' }, async ({ apiClient }) => {
    const { body } = await apiClient.tasks()
    const idByTitle = new Map(body.data.map((task) => [task.title, task.id]))

    expect(TYPED_TITLES.map((title) => idByTitle.get(title))).toEqual([
      SEEDED.typed.sheetUpload.id,
      SEEDED.typed.docUpload.id,
      SEEDED.typed.web.id,
      SEEDED.typed.subtasks.id,
      SEEDED.typed.sheetBrowser.id,
    ])
  })

  test('a típusos témakör megjelenik a témakörök között', { tag: '@smoke' }, async ({ apiClient }) => {
    const { body } = await apiClient.topics()
    const topic = body.data.find((candidate) => candidate.slug === SEEDED.typed.topic.slug)

    expect(topic?.name).toBe(SEEDED.typed.topic.name)
    expect(topic?.task_count).toBe(SEEDED.typed.topic.publishedTaskCount)

    const tasks = await apiClient.tasks({ topic: SEEDED.typed.topic.slug })
    expect(tasks.body.data.map((task) => task.title).sort()).toEqual([...TYPED_TITLES].sort())
    expect(tasks.body.data.every((task) => task.level === 'kozep')).toBe(true)
  })

  test('a nem kódfeladatoknak nincs nyelve, a részfeladatos kódfeladat Python', { tag: '@regression' }, async ({ apiClient }) => {
    const { body } = await apiClient.tasks({ topic: SEEDED.typed.topic.slug })
    const languages = new Map(body.data.map((task) => [task.id, task.allowed_languages]))

    expect(languages.get(SEEDED.typed.sheetUpload.id)).toEqual([])
    expect(languages.get(SEEDED.typed.web.id)).toEqual([])
    expect(languages.get(SEEDED.typed.subtasks.id)).toEqual([SEEDED.typed.subtasks.language])
  })

  test('a fizetős leckében lévő fájlfeladat vendégnek zárolt, az ingyenes nem', { tag: '@regression' }, async ({ apiClient }) => {
    const locked = await apiClient.get<{ data: { locked: boolean; locked_reason: string | null } }>(`tasks/${SEEDED.typed.docUpload.id}`)
    const open = await apiClient.get<{ data: { locked: boolean; locked_reason: string | null } }>(`tasks/${SEEDED.typed.sheetUpload.id}`)

    expect(locked.body.data).toMatchObject({ locked: true, locked_reason: 'login_required' })
    expect(open.body.data).toMatchObject({ locked: false, locked_reason: null })
  })

  test('a részfeladatos kódfeladat nyilvános tesztesete a seed szerinti', { tag: '@regression' }, async ({ apiClient }) => {
    const { body } = await apiClient.task(SEEDED.typed.subtasks.id)

    expect(body.data.example_test_cases).toHaveLength(1)
    expect(body.data.example_test_cases[0]?.expected_stdout).toBe(SEEDED.typed.subtasks.expectedStdout)
    expect(body.data.hidden_test_case_count).toBe(0)
  })
})

test.describe('Alapozás: tesztsegédek', () => {
  test('a premiumStudent hozzáfér a fizetős feladathoz, a megerősített diák nem', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const premium = await premiumStudent(apiClient, admin.client)
    const plain = await verifiedStudent(apiClient, admin.client)
    const path = `tasks/${SEEDED.typed.docUpload.id}`

    const forPremium = await premium.client.get<{ data: { locked: boolean } }>(path)
    const forPlain = await plain.client.get<{ data: { locked: boolean; locked_reason: string } }>(path)

    expect(forPremium.body.data.locked).toBe(false)
    expect(forPlain.body.data).toMatchObject({ locked: true, locked_reason: 'subscription_required' })
    expect((await premium.client.me()).body.data.email_verified_at).not.toBeNull()
  })

  test('a postMultipart valódi multipart kérést küld, a getBinary nyers választ ad', { tag: '@regression' }, async ({ apiClient }) => {
    const file = fixtureFile(FIXTURE_FILES.sheetOk)
    // Egy meglévő JSON végpontra küldve: a mezők megérkeznek (a hiba a hiányzó mezőkről szól, nem a formátumról).
    const result = await apiClient.postMultipart<unknown>('auth/login', { email: 'nem-letezik@example.test' }, file)

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('password')
    expect(result.errorBody.errors).not.toHaveProperty('email')

    const health = await apiClient.getBinary('health')
    expect(health.status).toBe(200)
    expect(JSON.parse(health.body.toString('utf8'))).toEqual({ ok: true })
    expect(health.headers['content-type']).toContain('application/json')
  })

  test('az aláírás nélküli csatolmány-letöltés 403, token nem helyettesíti', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const path = `attachments/${SEEDED.typed.subtasks.source.attachmentId}/download`

    expect((await apiClient.getBinary(path)).status).toBe(403)
    expect((await admin.client.getBinary(path)).status).toBe(403)
    expect((await apiClient.getBinary(`${path}?expires=4102444800&signature=${'0'.repeat(64)}`)).status).toBe(403)
  })
})

test.describe('Alapozás: fixture fájlok', () => {
  test('minden bináris fixture megvan és a PHP 2 MB-os feltöltési korlátja alatt marad', { tag: '@regression' }, () => {
    const files = Object.values(FIXTURE_FILES).map((name) => fixtureFile(name))

    expect(files).toHaveLength(Object.keys(FIXTURE_FILES).length)
    for (const file of files) {
      expect(file.buffer.length, file.name).toBeGreaterThan(0)
      expect(file.buffer.length, file.name).toBeLessThan(20 * 1024)
    }

    // A zip-alapú formátumok "PK" aláírással kezdődnek; az átnevezett szövegfájl nem.
    expect(fixtureFile(FIXTURE_FILES.sheetOk).buffer.subarray(0, 2).toString('latin1')).toBe('PK')
    expect(fixtureFile(FIXTURE_FILES.sheetOds).buffer.subarray(0, 2).toString('latin1')).toBe('PK')
    expect(fixtureFile(FIXTURE_FILES.docA4).buffer.subarray(0, 2).toString('latin1')).toBe('PK')
    expect(fixtureFile(FIXTURE_FILES.corrupt).buffer.subarray(0, 2).toString('latin1')).not.toBe('PK')
  })
})
