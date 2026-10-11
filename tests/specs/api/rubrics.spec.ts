import { adminAccount } from '../../src/api/areas/accounts'
import { fileSubmissions, SHEET_FIXTURES } from '../../src/api/areas/fileTasks'
import {
  createRubricItem,
  deleteRubricItem,
  reorderRubricItems,
  rubricCheck,
  rubricItemInput,
  rubricItems,
  updateRubricItem,
} from '../../src/api/areas/rubrics'
import type { ApiClient } from '../../src/api/ApiClient'
import { FIXTURE_FILES, registration, SEEDED } from '../../src/data'
import { fixtureFile } from '../../src/data/files'
import { expect, test } from '../../src/fixtures'

const SHEET = SEEDED.typed.sheetUpload
const CODE_EXERCISE_ID = 1

/** Az 5. feladat ertekelolapjara felvett atmeneti pont torlese (a tobbi spec a negy toroltt pontot varja). */
async function removeTemporary(admin: ApiClient, ids: number[]): Promise<void> {
  for (const id of ids) await deleteRubricItem(admin, id)
}

test.describe('Értékelőlap: hozzáférés', () => {
  test('vendég 401, diák 403', { tag: '@smoke' }, async ({ apiClient }) => {
    const student = (await apiClient.signUp(registration())).client

    expect((await rubricItems(apiClient, SHEET.id)).status).toBe(401)
    expect((await rubricItems(student, SHEET.id)).status).toBe(403)
    expect((await createRubricItem(student, SHEET.id, rubricItemInput())).status).toBe(403)
    expect((await rubricCheck(student, SHEET.id)).status).toBe(403)
  })
})

test.describe('Értékelőlap: szerkesztés', () => {
  test('a lista a négy kezdőadat-pontot adja sorrendben, más feladatra üres', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client

    const list = await rubricItems(admin, SHEET.id)

    expect(list.status).toBe(200)
    expect(list.body.data.map((item) => item.id)).toEqual(SHEET.rubric.map((item) => item.id))
    expect(list.body.data[0]).toMatchObject({ label: SHEET.rubric[0].label, check_type: 'cell_value', property: 'Munka1!B2', expected: '42', points: 4, mode: 'auto' })
    expect((await rubricItems(admin, CODE_EXERCISE_ID)).body.data).toEqual([])
  })

  test('érvényes automatikus pont létrehozása a végére kerül; módosítható és törölhető', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client

    const created = await createRubricItem(admin, SHEET.id, rubricItemInput({ label: 'PW új pont' }))

    expect(created.status).toBe(201)
    const id = created.body.data.id
    try {
      expect(created.body.data).toMatchObject({ label: 'PW új pont', position: 4, mode: 'auto', hint: 'PW tipp' })
      const updated = await updateRubricItem(admin, id, rubricItemInput({ label: 'PW módosított', expected: '11', points: 3 }))
      expect(updated.status).toBe(200)
      expect(updated.body.data).toMatchObject({ id, label: 'PW módosított', expected: '11', points: 3 })
    } finally {
      expect((await deleteRubricItem(admin, id)).status).toBe(204)
    }
    expect((await rubricItems(admin, SHEET.id)).body.data).toHaveLength(SHEET.rubric.length)
  })

  test('ismeretlen tulajdonság: 422 a property mezőn', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client

    const result = await createRubricItem(admin, SHEET.id, rubricItemInput({ property: 'nem cím' }))

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('property')
    expect((await rubricItems(admin, SHEET.id)).body.data).toHaveLength(SHEET.rubric.length)
  })

  test('olyan vizsgálat, amelyhez nincs kezelő, automatikusan nem menthető (422)', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client

    const result = await createRubricItem(admin, SHEET.id, rubricItemInput({ check_type: 'nincs_ilyen' }))

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('check_type')
  })

  test('a manual vizsgálat kézi módra kényszerül', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client

    const created = await createRubricItem(admin, SHEET.id, rubricItemInput({ check_type: 'manual', mode: 'auto', property: '', expected: '' }))

    expect(created.status).toBe(201)
    await removeTemporary(admin, [created.body.data.id])
    expect(created.body.data.mode).toBe('manual')
  })

  test('törléskor a pozíciók összehúzódnak', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const first = (await createRubricItem(admin, SHEET.id, rubricItemInput({ label: 'PW egy' }))).body.data.id
    const second = (await createRubricItem(admin, SHEET.id, rubricItemInput({ label: 'PW kettő' }))).body.data.id

    try {
      expect((await deleteRubricItem(admin, first)).status).toBe(204)
      const list = (await rubricItems(admin, SHEET.id)).body.data
      expect(list.map((item) => item.position)).toEqual([0, 1, 2, 3, 4])
      expect(list[4]?.id).toBe(second)
    } finally {
      await removeTemporary(admin, [second])
    }
  })

  test('sorrendezés: hiányzó azonosítóval 422, teljes listával 204', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const ids = SHEET.rubric.map((item) => item.id)

    const missing = await reorderRubricItems(admin, SHEET.id, ids.slice(1))
    expect(missing.status).toBe(422)

    const reversed = [...ids].reverse()
    try {
      expect((await reorderRubricItems(admin, SHEET.id, reversed)).status).toBe(204)
      expect((await rubricItems(admin, SHEET.id)).body.data.map((item) => item.id)).toEqual(reversed)
    } finally {
      expect((await reorderRubricItems(admin, SHEET.id, ids)).status).toBe(204)
    }
    expect((await rubricItems(admin, SHEET.id)).body.data.map((item) => item.id)).toEqual(ids)
  })
})

test.describe('Értékelőlap: próba', () => {
  test('fájllal: id 0, nem tárol beadást', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const before = (await fileSubmissions(admin, SHEET.id)).body.data

    const result = await rubricCheck(admin, SHEET.id, fixtureFile(FIXTURE_FILES.sheetOk))

    expect(result.status).toBe(200)
    expect(result.body.data).toMatchObject({ id: 0, attempt: 1, status: 'evaluated', score: SHEET.expected.ok.score, max_score: SHEET.rubricTotal })
    expect((await fileSubmissions(admin, SHEET.id)).body.data).toEqual(before)
  })

  test('fájl és mintamegoldás nélkül 422', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client

    expect((await rubricCheck(admin, SHEET.id)).status).toBe(422)
  })

  test('sérült fájllal failed állapot, nem hiba', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client

    const result = await rubricCheck(admin, SHEET.id, fixtureFile(FIXTURE_FILES.emptyZip))

    expect(result.body.data.status).toBe('failed')
  })
})

/** Az összes táblázatos vizsgálat egy-egy pontja a „teljes” munkafüzeten; a végén két szándékosan hibás. */
const CHECKS: { label: string; check_type: string; property: string; expected: string; state: 'ok' | 'bad' }[] = [
  { label: 'érték', check_type: 'cell_value', property: 'Adatok!B2', expected: '50', state: 'ok' },
  { label: 'szöveg érték', check_type: 'cell_value', property: 'Adatok!D3', expected: 'Sok', state: 'ok' },
  { label: 'rossz érték', check_type: 'cell_value', property: 'Adatok!B2', expected: '51', state: 'bad' },
  { label: 'képlet', check_type: 'cell_formula', property: 'Adatok!D2', expected: 'fn:SZUM,nofixed', state: 'ok' },
  { label: 'másolt képlet', check_type: 'cell_formula', property: 'Adatok!C2:C6', expected: 'copied', state: 'ok' },
  { label: 'hivatkozás', check_type: 'cell_formula', property: 'Adatok!C2', expected: 'ref:B2', state: 'ok' },
  { label: 'rossz függvény', check_type: 'cell_formula', property: 'Adatok!D2', expected: 'fn:ÁTLAG', state: 'bad' },
  { label: 'formátum', check_type: 'number_format', property: 'Adatok!C2:C6', expected: '# ##0 "Ft"', state: 'ok' },
  { label: 'rendezés szöveg', check_type: 'sort_order', property: 'Adatok!A2:A6', expected: 'asc', state: 'ok' },
  { label: 'rendezés szám', check_type: 'sort_order', property: 'Adatok!A2:B6@2', expected: 'desc,num', state: 'ok' },
  { label: 'diagram típus', check_type: 'chart', property: 'type', expected: 'column', state: 'ok' },
  { label: 'diagram cím', check_type: 'chart', property: 'title', expected: 'Pontok', state: 'ok' },
  { label: 'diagram tengelyek', check_type: 'chart', property: 'y_title', expected: 'Pont', state: 'ok' },
  { label: 'adatsorok', check_type: 'chart', property: 'series_count', expected: '2', state: 'ok' },
  { label: 'jelmagyarázat', check_type: 'chart', property: 'has_legend', expected: 'igen', state: 'ok' },
  { label: 'nyomtatási terület', check_type: 'print_area', property: 'Adatok', expected: 'A1:D10', state: 'ok' },
  { label: 'oszlopszélesség', check_type: 'sheet_format', property: 'column_width[A]', expected: '20', state: 'ok' },
  { label: 'rejtett oszlop', check_type: 'sheet_format', property: 'column_hidden[C]', expected: 'igen', state: 'ok' },
  { label: 'munkalap neve', check_type: 'sheet_format', property: 'sheet_name', expected: 'Összesítő', state: 'ok' },
  { label: 'feltételes formázás', check_type: 'conditional_format', property: 'Adatok!B2:B6', expected: 'rule:greater_than 25,fill:piros', state: 'ok' },
  { label: 'rossz feltételes formázás', check_type: 'conditional_format', property: 'Adatok!B2:B6', expected: 'rule:less_than 25', state: 'bad' },
]

test.describe('Értékelőlap: minden táblázatos vizsgálat xlsx-en és ods-en', () => {
  for (const file of [SHEET_FIXTURES.fullXlsx, SHEET_FIXTURES.fullOds]) {
    test(`${file}: a pontok az elvárt állapotot kapják`, { tag: '@regression' }, async ({ apiClient }) => {
      const admin = (await adminAccount(apiClient)).client
      const ids: number[] = []
      try {
        for (const check of CHECKS) {
          const created = await createRubricItem(admin, SHEET.id, rubricItemInput({ ...check, label: `PW ${check.label}` }))
          expect(created.status, check.label).toBe(201)
          ids.push(created.body.data.id)
        }

        const result = await rubricCheck(admin, SHEET.id, fixtureFile(file))

        expect(result.body.data.status).toBe('evaluated')
        const states = new Map(result.body.data.items.map((item) => [item.label, item.state]))
        for (const check of CHECKS) expect(states.get(`PW ${check.label}`), check.label).toBe(check.state)
      } finally {
        await removeTemporary(admin, ids)
      }
    })
  }
})

/** Magyar rendezés (pw-tabla-magyar.xlsx): A1:A11 magyar sorrendben áll, B1:B11 az ASCII-sorrendben (ami magyarul hibás). */
const SORT_CHECKS: { label: string; property: string; expected: string; state: 'ok' | 'bad' }[] = [
  { label: 'cs a c után (Cukor, Csaba)', property: 'Munka1!A1:A11', expected: 'asc', state: 'ok' },
  { label: 'ASCII-sorrend hibás magyarul', property: 'Munka1!B1:B11', expected: 'asc', state: 'bad' },
  { label: 'csökkenő nem igaz', property: 'Munka1!A1:A11', expected: 'desc', state: 'bad' },
  { label: 'Zoltán a Zsolt előtt', property: 'Munka1!A10:A11', expected: 'asc', state: 'ok' },
  { label: 'ekezetes magánhangzó (Eper, Épület)', property: 'Munka1!A4:A5', expected: 'asc', state: 'ok' },
  { label: 'rövid a hosszú előtt (Szel, Szél)', property: 'Munka1!A8:A9', expected: 'asc', state: 'ok' },
  { label: 'g a gy előtt (Géza, Gyula)', property: 'Munka1!A6:A7', expected: 'asc', state: 'ok' },
  { label: 'fordítva a Szél, Szel hibás', property: 'Munka1!A8:A9', expected: 'desc', state: 'bad' },
]

test('a szöveges rendezés a magyar ábécé szerint ítélkezik', { tag: '@regression' }, async ({ apiClient }) => {
  const admin = (await adminAccount(apiClient)).client
  const ids: number[] = []
  try {
    for (const check of SORT_CHECKS) {
      const created = await createRubricItem(admin, SHEET.id, rubricItemInput({ check_type: 'sort_order', label: `PW ${check.label}`, property: check.property, expected: check.expected }))
      expect(created.status, check.label).toBe(201)
      ids.push(created.body.data.id)
    }

    const result = await rubricCheck(admin, SHEET.id, fixtureFile(SHEET_FIXTURES.hungarianXlsx))

    const states = new Map(result.body.data.items.map((item) => [item.label, item.state]))
    for (const check of SORT_CHECKS) expect(states.get(`PW ${check.label}`), check.label).toBe(check.state)
  } finally {
    await removeTemporary(admin, ids)
  }
})
