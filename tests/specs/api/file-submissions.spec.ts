import { adminAccount, verifiedStudent } from '../../src/api/areas/accounts'
import { fileSubmission, fileSubmissions, saveManualMarks, SHEET_FIXTURES, uploadFileSubmission } from '../../src/api/areas/fileTasks'
import { adminExercise } from '../../src/api/areas/typedTasks'
import { zipBomb } from '../../src/api/areas/zip'
import type { ApiClient } from '../../src/api/ApiClient'
import { FIXTURE_FILES, registration, SEEDED, TEST_BACKEND } from '../../src/data'
import { fixtureFile, uploadOf } from '../../src/data/files'
import { expect, test } from '../../src/fixtures'

const SHEET = SEEDED.typed.sheetUpload
const DOC = SEEDED.typed.docUpload
/** A kodfeladat (1. feladat): ide nem toltheto fel fajl. */
const CODE_EXERCISE_ID = 1

/** Friss diak (tokenes kliens): a beadasok szamlaloja es a lista igy fiokonkent fuggetlen. */
async function student(apiClient: ApiClient): Promise<ApiClient> {
  return (await apiClient.signUp(registration())).client
}

test.describe('Fájlbeadás: hozzáférés', () => {
  test('vendég nem tölthet fel, és nem listázhat (401)', { tag: '@smoke' }, async ({ apiClient }) => {
    const upload = await uploadFileSubmission(apiClient, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))
    const list = await fileSubmissions(apiClient, SHEET.id)

    expect(upload.status).toBe(401)
    expect(list.status).toBe(401)
  })

  test('ismeretlen feladatra 404', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)

    expect((await uploadFileSubmission(client, 999999, fixtureFile(FIXTURE_FILES.sheetOk))).status).toBe(404)
    expect((await fileSubmissions(client, 999999)).status).toBe(404)
  })

  test('kódfeladatra nem tölthető fel fájl (422)', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await uploadFileSubmission(await student(apiClient), CODE_EXERCISE_ID, fixtureFile(FIXTURE_FILES.sheetOk))

    expect(result.status).toBe(422)
    expect(result.errorBody.message).toBe('Ehhez a feladathoz nem tölthető fel fájl. Használd a szerkesztőt.')
  })

  test('fizetős leckében előfizetés nélkül 403 (subscription_required)', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const { client } = await verifiedStudent(apiClient, admin.client)

    const result = await uploadFileSubmission(client, DOC.id, fixtureFile(FIXTURE_FILES.docA4))

    expect(result.status).toBe(403)
    expect(result.errorBody).toMatchObject({ reason: 'subscription_required' })
  })
})

test.describe('Fájlbeadás: értékelés', () => {
  test('a hibátlan xlsx 9/10 pontot kap, a kézi pont jelöletlen', { tag: '@smoke' }, async ({ apiClient }) => {
    const client = await student(apiClient)

    const result = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))

    expect(result.status).toBe(201)
    const submission = result.body.data
    expect(submission).toMatchObject({
      exercise_id: SHEET.id,
      exercise_title: SHEET.title,
      attempt: 1,
      status: 'evaluated',
      score: SHEET.expected.ok.score,
      max_score: SHEET.rubricTotal,
      previous_score: null,
      error: null,
      preview_url: null,
    })
    expect(submission.file.name).toBe(FIXTURE_FILES.sheetOk)
    expect(submission.groups).toEqual([
      { name: 'Képletek', score: 7, max_score: 7 },
      { name: 'Formázás', score: 2, max_score: 3 },
    ])
    expect(submission.items.map((item) => item.state)).toEqual(['ok', 'ok', 'ok', 'manual'])
    const manual = submission.items.find((item) => item.rubric_item_id === SHEET.manualItemId)
    expect(manual).toMatchObject({ state: 'manual', points: 0, max_points: 1, manual_mark: null })
    expect(submission.facts.map((fact) => fact.label)).toContain('Munkalapok')
    expect(submission.sample_url).toContain('attachments/')
  })

  test('az ods ugyanazt a pontszámot kapja, mint az xlsx', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile(FIXTURE_FILES.sheetOds))

    expect(result.status).toBe(201)
    expect(result.body.data.status).toBe('evaluated')
    expect(result.body.data.score).toBe(SHEET.expected.ok.score)
    expect(result.body.data.groups.map((group) => group.score)).toEqual([7, 2])
  })

  test('a második beadás sorszáma 2, az előző pontszámmal; a hibás sor tippet kap, a lista a legújabbal kezd', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const first = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))

    const second = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetWrong))

    expect(second.status).toBe(201)
    expect(second.body.data).toMatchObject({ attempt: 2, previous_score: SHEET.expected.ok.score, score: SHEET.expected.wrong.score })
    expect(second.body.data.score).toBeLessThan(first.body.data.score)
    const failing = second.body.data.items.filter((item) => SHEET.expected.wrong.failingItemIds.some((id) => id === item.rubric_item_id))
    expect(failing).toHaveLength(2)
    for (const item of failing) {
      expect(item.state).toBe('bad')
      expect(item.points).toBe(0)
      expect(item.hint).not.toBeNull()
    }

    const list = await fileSubmissions(client, SHEET.id)
    expect(list.status).toBe(200)
    expect(list.body.data.map((row) => row.attempt)).toEqual([2, 1])
  })

  test('a diagramot, rendezést és nyomtatási területet tartalmazó munkafüzet is kiértékelhető', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile('pw-tabla-teljes.xlsx'))

    expect(result.status).toBe(201)
    expect(result.body.data.status).toBe('evaluated')
    const facts = Object.fromEntries(result.body.data.facts.map((fact) => [fact.label, fact.value]))
    expect(facts.Munkalapok).toBe('Adatok, Összesítő')
    expect(facts.Diagramok).toContain('oszlopdiagram')
  })

  test('érvényes zip munkafüzet nélkül: 201 és failed, magyar hibaüzenettel', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)

    const result = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.emptyZip))

    expect(result.status).toBe(201)
    expect(result.body.data).toMatchObject({ status: 'failed', score: 0, error: 'A fájl sérült, vagy nem a kért formátumban van.', attempt: 1 })
    // A sikertelen feldolgozás is beadásnak számít.
    const next = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))
    expect(next.body.data.attempt).toBe(2)
    expect(next.body.data.previous_score).toBeNull()
  })
})

test.describe('Fájlbeadás: ellenséges és LibreOffice-szerű fájlok', () => {
  test('a styles.xml-ben tárolt számformátum és cellastílus is érvényesül (ugyanaz a pontszám, mint a content.xml-es ods-nél)', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile(SHEET_FIXTURES.stylesOds))

    expect(result.status).toBe(201)
    expect(result.body.data.score).toBe(SHEET.expected.ok.score)
    const format = result.body.data.items.find((item) => item.label === SHEET.rubric[2].label)
    expect(format?.state).toBe('ok')
  })

  test('ertek nelkuli, formazott cellak sor vegi millios ismetlese (egesz sor/oszlop formazasa) nem fogy el a cellakeret: ugyanaz a pontszam', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile(SHEET_FIXTURES.formattedColumnOds))

    expect(result.status).toBe(201)
    expect(result.body.data.status).not.toBe('failed')
    expect(result.body.data.score).toBe(SHEET.expected.ok.score)
  })

  for (const file of [SHEET_FIXTURES.manyEmptyXlsx, SHEET_FIXTURES.manyEmptyOds, SHEET_FIXTURES.manyRepeatedOds]) {
    test(`${file}: egyetlen sorban rengeteg üres cella: 201 és failed, nem összeomlás`, { tag: '@regression' }, async ({ apiClient }) => {
      const result = await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile(file))

      expect(result.status).toBe(201)
      expect(result.body.data).toMatchObject({ status: 'failed', score: 0, error: 'A fájl sérült, vagy nem a kért formátumban van.' })
    })
  }
})

test.describe('Fájlbeadás: admin számláló', () => {
  test('a feladat submission_count értéke a fájlbeadásokat is számolja', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const uploaded = await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))
    expect(uploaded.status).toBe(201)

    const detail = await adminExercise(admin.client, SHEET.id)

    expect(detail.body.data.submission_count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('Fájlbeadás: feltöltési ellenőrzés', () => {
  test('nem engedélyezett kiterjesztés (.docx a táblázat feladatra): 422 a file mezőn', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile(FIXTURE_FILES.docA4))

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('file')
  })

  test('makrós .xlsm: 422 a makró üzenettel', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile(FIXTURE_FILES.macro))

    expect(result.status).toBe(422)
    expect(result.errorBody.errors.file?.[0]).toContain('makró')
  })

  test('xlsx néven rejtett makrót hordozó csomag: 422', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile(FIXTURE_FILES.hiddenMacro))

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('file')
  })

  test('átnevezett szövegfájl (.xlsx): 422', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile(FIXTURE_FILES.corrupt))

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('file')
  })

  test('zip-bomba: 422', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await uploadFileSubmission(await student(apiClient), SHEET.id, uploadOf('bomba.xlsx', zipBomb()))

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('file')
  })

  test('túl nagy fájl: 422 a file mezőn', { tag: '@regression' }, async ({ apiClient }) => {
    const oversize = Buffer.alloc(Math.floor(TEST_BACKEND.maxDocumentBytes * 1.5), 0x41)

    const result = await uploadFileSubmission(await student(apiClient), SHEET.id, uploadOf('nagy.xlsx', oversize))

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('file')
  })

  test('a 11. feltöltés után csak a legutóbbi 10 sor marad', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    for (let index = 0; index < 11; index++) {
      expect((await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))).status).toBe(201)
    }

    const list = await fileSubmissions(client, SHEET.id)

    expect(list.body.data).toHaveLength(10)
    expect(list.body.data.map((row) => row.attempt)).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  })
})

test.describe('Fájlbeadás: kézi pontok', () => {
  test('a kézi tétel megjelölése 10 pontra emeli az eredményt, a jelölés visszavonható', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const created = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))
    const id = created.body.data.id

    const marked = await saveManualMarks(client, id, { [String(SHEET.manualItemId)]: true })

    expect(marked.status).toBe(200)
    expect(marked.body.data.score).toBe(SHEET.expected.okWithManualMark.score)
    const item = marked.body.data.items.find((row) => row.rubric_item_id === SHEET.manualItemId)
    expect(item).toMatchObject({ state: 'manual', manual_mark: true, points: 1 })
    expect(marked.body.data.groups.map((group) => group.score)).toEqual([7, 3])
    expect((await fileSubmission(client, id)).body.data.score).toBe(10)

    const unmarked = await saveManualMarks(client, id, { [String(SHEET.manualItemId)]: false })
    expect(unmarked.body.data.score).toBe(SHEET.expected.ok.score)
    expect(unmarked.body.data.items.find((row) => row.rubric_item_id === SHEET.manualItemId)).toMatchObject({ manual_mark: false, points: 0 })
  })

  test('nem kézi tétel jelölése 422 a marks mezőn', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const created = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))

    const result = await saveManualMarks(client, created.body.data.id, { '1': true })

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('marks')
  })

  test('nem logikai érték 422', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const created = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))

    const result = await saveManualMarks(client, created.body.data.id, { [String(SHEET.manualItemId)]: 'igen' })

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty([`marks.${String(SHEET.manualItemId)}`])
  })

  test('sikertelen feldolgozású beadást nem lehet jelölni (422)', { tag: '@regression' }, async ({ apiClient }) => {
    const client = await student(apiClient)
    const created = await uploadFileSubmission(client, SHEET.id, fixtureFile(FIXTURE_FILES.emptyZip))

    const result = await saveManualMarks(client, created.body.data.id, { [String(SHEET.manualItemId)]: true })

    expect(result.status).toBe(422)
  })
})

test.describe('Fájlbeadás: más felhasználó beadása', () => {
  test('idegen beadás olvasása és jelölése 404, az admin olvashatja', { tag: '@regression' }, async ({ apiClient }) => {
    const owner = await student(apiClient)
    const stranger = await student(apiClient)
    const admin = await adminAccount(apiClient)
    const id = (await uploadFileSubmission(owner, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))).body.data.id

    expect((await fileSubmission(stranger, id)).status).toBe(404)
    expect((await saveManualMarks(stranger, id, { [String(SHEET.manualItemId)]: true })).status).toBe(404)
    expect((await fileSubmission(admin.client, id)).status).toBe(200)
    expect((await saveManualMarks(admin.client, id, { [String(SHEET.manualItemId)]: true })).status).toBe(404)
    // Az idegen listájában sem jelenik meg.
    expect((await fileSubmissions(stranger, SHEET.id)).body.data).toEqual([])
  })

  // A feladat törlését a törlési szabály (WP1) tiltja, ha van hozzá fájlbeadás.
  test('beadással rendelkező feladat törlése 409', async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    await uploadFileSubmission(await student(apiClient), SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))

    const result = await admin.client.delete(`admin/exercises/${String(SHEET.id)}`)

    expect(result.status).toBe(409)
  })
})
