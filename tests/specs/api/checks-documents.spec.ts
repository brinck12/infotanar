import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { adminAccount } from '../../src/api/areas/accounts'
import { createExercise, deleteExercise } from '../../src/api/areas/typedTasks'
import { SEEDED } from '../../src/data'
import { fixtureFile } from '../../src/data/files'
import { expect, test } from '../../src/fixtures'

/**
 * Dokumentum-vizsgalatok (WP4): docx es odt.
 *
 * A property-tablazat minden sorahoz van pozitiv es negativ eset. Az esetek egy
 * fixture fajlon `php artisan filetasks:evaluate --item=...` alkalmi pontokkal
 * futnak (nem modositjak az adatbazist, igy a tobbi spec 6. feladatat sem
 * zavarjak); a vegpont-szintu esetek a valodi rubric-check vegponton at mennek
 * a 6. (doc_upload) feladat tarolt ertekelolapjan, amely csak a lapmeretet
 * vizsgalja. A BACKEND.md 7.6 esetei a vegponton at is futnak ideiglenes doc_upload
 * feladattal (docx es odt).
 */

type State = 'ok' | 'bad'
/** [vizsgalattipus, property, elvart ertek, vart allapot] */
type Case = readonly [string, string, string, State]

interface EvaluatedItem {
  state: State
  found: string | null
}
interface Evaluation {
  items: EvaluatedItem[]
  facts: { label: string; value: string }[]
}

const BACKEND_DIR = path.resolve(__dirname, '../../../backend')
const FIXTURES = path.resolve(__dirname, '../../fixtures/files/documents')

/** Egy fixture fajl kiertekelese alkalmi pontokkal (a teszt-backend adatbazisan, semmit nem ment). */
function evaluate(file: string, cases: readonly Case[]): Evaluation {
  const items = cases.map(([type, property, expected]) => `--item=${type}|${property}|${expected}`)
  const output = execFileSync('php', ['artisan', 'filetasks:evaluate', String(SEEDED.typed.docUpload.id), path.join(FIXTURES, file), ...items], {
    cwd: BACKEND_DIR,
    encoding: 'utf8',
    env: { ...process.env, APP_ENV: 'testing', DB_CONNECTION: 'sqlite', DB_DATABASE: 'database/testing.sqlite' },
  })
  return JSON.parse(output.slice(output.indexOf('{'))) as Evaluation
}

// Az A: mindket formatumon azonos esetek (a minta felepitese a generatorban).
// Bekezdesek: 1 Cimsor 1, 2 kozvetlen formazas, 3 tiltott elvalasztas + karakterstilus, 4 Cimsor 1 oldaltoressel,
// 5 Idezet stilus, 6 felsorolas, 7 szamozott alelem, 8 felso index, 9 also index, 10 kiskapitalis, 11 tema betu,
// 12 beagyazott kep, 13 koruljart kep.
const COMMON: readonly Case[] = [
  // page_setup
  ['page_setup', 'page_size', 'A4', 'ok'],
  ['page_setup', 'page_size', 'Letter', 'bad'],
  ['page_setup', 'orientation', 'álló', 'ok'],
  ['page_setup', 'orientation', 'fekvő', 'bad'],
  ['page_setup', 'margin_top', '2,5 cm', 'ok'],
  ['page_setup', 'margin_top', '25.4mm', 'ok'],
  ['page_setup', 'margin_top', '3 cm', 'bad'],
  ['page_setup', 'margin_bottom', '2 cm', 'ok'],
  ['page_setup', 'margin_bottom', '2,5 cm', 'bad'],
  ['page_setup', 'margin_left', '3 cm', 'ok'],
  ['page_setup', 'margin_left', '2 cm', 'bad'],
  ['page_setup', 'margin_right', '2 cm', 'ok'],
  ['page_setup', 'margin_right', '3 cm', 'bad'],
  // character_format: dokumentum-alapertelmezes, stilusbol (cimsor), kozvetlen formazas, karakterstilus, tema
  ['character_format', 'font', 'times new roman', 'ok'],
  ['character_format', 'font', 'Arial', 'bad'],
  ['character_format', 'font_size', '12', 'ok'],
  ['character_format', 'font_size', '14', 'bad'],
  ['character_format', 'bold', 'nem', 'ok'],
  ['character_format', 'bold', 'igen', 'bad'],
  ['character_format', 'font[heading=1]', 'Arial', 'ok'],
  ['character_format', 'font[heading=1]', 'Verdana', 'bad'],
  ['character_format', 'font_size[heading=2]', '16 pt', 'ok'],
  ['character_format', 'font_size[heading=1]', '12', 'bad'],
  ['character_format', 'bold[paragraph=1]', 'igen', 'ok'],
  ['character_format', 'bold[paragraph=1]', 'nem', 'bad'],
  ['character_format', 'color[paragraph=1]', 'piros', 'ok'],
  ['character_format', 'color[paragraph=1]', 'kék', 'bad'],
  ['character_format', 'font[style=Címsor 1]', 'Arial', 'ok'],
  ['character_format', 'font[style=Heading 1]', 'Arial', 'ok'],
  ['character_format', 'font[paragraph=2]', 'Verdana', 'ok'],
  ['character_format', 'font[paragraph=2]', 'Arial', 'bad'],
  ['character_format', 'font_size[paragraph=2]', '14', 'ok'],
  ['character_format', 'font_size[text=Közvetlen]', '14', 'ok'],
  ['character_format', 'font_size[text=Közvetlen]', '12', 'bad'],
  ['character_format', 'bold[paragraph=2]', 'igen', 'ok'],
  ['character_format', 'italic[paragraph=2]', 'igen', 'ok'],
  ['character_format', 'italic[paragraph=4]', 'igen', 'bad'],
  ['character_format', 'underline[paragraph=2]', 'igen', 'ok'],
  ['character_format', 'underline[paragraph=1]', 'igen', 'bad'],
  ['character_format', 'color[paragraph=2]', '#0000FF', 'ok'],
  ['character_format', 'color[paragraph=2]', 'piros', 'bad'],
  ['character_format', 'italic[paragraph=5]', 'igen', 'ok'],
  ['character_format', 'color[paragraph=5]', 'szürke', 'ok'],
  ['character_format', 'bold[paragraph=3]', 'igen', 'bad'],
  ['character_format', 'underline[text=kiemelt]', 'nem', 'bad'],
  ['character_format', 'superscript[paragraph=8]', 'igen', 'ok'],
  ['character_format', 'superscript[paragraph=9]', 'igen', 'bad'],
  ['character_format', 'subscript[paragraph=9]', 'igen', 'ok'],
  ['character_format', 'subscript[paragraph=8]', 'igen', 'bad'],
  ['character_format', 'small_caps[paragraph=10]', 'igen', 'ok'],
  ['character_format', 'small_caps[paragraph=1]', 'igen', 'bad'],
  ['character_format', 'font[paragraph=11]', 'Calibri', 'ok'],
  ['character_format', 'font[paragraph=11]', 'Times New Roman', 'bad'],
  ['character_format', 'font[paragraph=99]', 'Arial', 'bad'],
  // paragraph_format
  ['paragraph_format', 'alignment', 'balra', 'ok'],
  ['paragraph_format', 'alignment', 'sorkizárt', 'bad'],
  ['paragraph_format', 'alignment[paragraph=2]', 'sorkizárt', 'ok'],
  ['paragraph_format', 'alignment[paragraph=2]', 'középre', 'bad'],
  ['paragraph_format', 'space_before[heading=1]', '12 pt', 'ok'],
  ['paragraph_format', 'space_before[heading=1]', '6 pt', 'bad'],
  ['paragraph_format', 'space_after[heading=1]', '6', 'ok'],
  ['paragraph_format', 'space_before[paragraph=2]', '6 pt', 'ok'],
  ['paragraph_format', 'space_after[paragraph=2]', '12 pt', 'ok'],
  ['paragraph_format', 'space_after[paragraph=2]', '0 pt', 'bad'],
  ['paragraph_format', 'line_spacing', '1', 'ok'],
  ['paragraph_format', 'line_spacing', '1,5', 'bad'],
  ['paragraph_format', 'line_spacing[paragraph=2]', '1,5', 'ok'],
  ['paragraph_format', 'line_spacing[paragraph=2]', 'dupla', 'bad'],
  ['paragraph_format', 'line_spacing[paragraph=5]', '15 pt', 'ok'],
  ['paragraph_format', 'line_spacing[paragraph=5]', '1,5', 'bad'],
  ['paragraph_format', 'indent_left[paragraph=2]', '1 cm', 'ok'],
  ['paragraph_format', 'indent_left[paragraph=2]', '2 cm', 'bad'],
  ['paragraph_format', 'indent_first[paragraph=2]', '1,25 cm', 'ok'],
  ['paragraph_format', 'indent_first[paragraph=2]', '0 cm', 'bad'],
  ['paragraph_format', 'indent_left[paragraph=5]', '1 cm', 'ok'],
  ['paragraph_format', 'hyphenation[paragraph=2]', 'igen', 'ok'],
  ['paragraph_format', 'hyphenation[paragraph=3]', 'nem', 'ok'],
  ['paragraph_format', 'hyphenation[paragraph=3]', 'igen', 'bad'],
  ['paragraph_format', 'page_break_before[paragraph=4]', 'igen', 'ok'],
  ['paragraph_format', 'page_break_before[paragraph=1]', 'igen', 'bad'],
  // style
  ['style', 'exists[style=Címsor 1]', 'igen', 'ok'],
  ['style', 'exists[style=Heading 1]', 'igen', 'ok'],
  ['style', 'exists[style=Nincs Ilyen]', 'igen', 'bad'],
  ['style', 'exists[style=Nincs Ilyen]', 'nem', 'ok'],
  ['style', 'applied[style=Idézet]', 'igen', 'ok'],
  ['style', 'applied[style=Nincs Ilyen]', 'igen', 'bad'],
  ['style', 'applied[heading=1]', 'Címsor 1', 'ok'],
  ['style', 'applied[heading=1]', 'Heading 1', 'ok'],
  ['style', 'applied[heading=1]', 'Idézet', 'bad'],
  ['style', 'applied[paragraph=5]', 'Idézet', 'ok'],
  ['style', 'applied[paragraph=2]', 'Idézet', 'bad'],
  ['style', 'applied[text=Idézet szöveg]', 'Idézet', 'ok'],
  // document_table
  ['document_table', 'rows', '3', 'ok'],
  ['document_table', 'rows', '4', 'bad'],
  ['document_table', 'columns', '2', 'ok'],
  ['document_table', 'columns[table=2]', '3', 'ok'],
  ['document_table', 'columns', '3', 'bad'],
  ['document_table', 'rows[table=2]', '2', 'ok'],
  ['document_table', 'border', 'igen', 'ok'],
  ['document_table', 'border', 'nem', 'bad'],
  ['document_table', 'border[table=2]', 'nem', 'ok'],
  ['document_table', 'border[table=2]', 'igen', 'bad'],
  ['document_table', 'width', '12 cm', 'ok'],
  ['document_table', 'width', '10 cm', 'bad'],
  ['document_table', 'height', '3 cm', 'ok'],
  ['document_table', 'height', '5 cm', 'bad'],
  ['document_table', 'shading', '#D9D9D9', 'ok'],
  ['document_table', 'shading', 'igen', 'ok'],
  ['document_table', 'shading', 'piros', 'bad'],
  ['document_table', 'shading[table=2]', 'nem', 'ok'],
  ['document_table', 'shading[table=2]', 'igen', 'bad'],
  ['document_table', 'alignment', 'középre', 'ok'],
  ['document_table', 'alignment', 'jobbra', 'bad'],
  ['document_table', 'alignment[table=2]', 'balra', 'ok'],
  ['document_table', 'rows[table=3]', '1', 'bad'],
  // image
  ['image', 'count', '2', 'ok'],
  ['image', 'count', '3', 'bad'],
  ['image', 'width', '8 cm', 'ok'],
  ['image', 'width', '9 cm', 'bad'],
  ['image', 'height[image=1]', '4 cm', 'ok'],
  ['image', 'width[image=2]', '3 cm', 'ok'],
  ['image', 'height[image=2]', '5 cm', 'bad'],
  ['image', 'aspect_ratio', '2', 'ok'],
  ['image', 'aspect_ratio', '2:1', 'ok'],
  ['image', 'aspect_ratio', '1,5', 'bad'],
  ['image', 'aspect_ratio[image=2]', '1', 'ok'],
  ['image', 'wrap', 'sorban', 'ok'],
  ['image', 'wrap', 'négyzetes', 'bad'],
  ['image', 'wrap[image=2]', 'négyzetes', 'ok'],
  ['image', 'wrap[image=2]', 'sorban', 'bad'],
  ['image', 'alt_text', 'Minta ábra', 'ok'],
  ['image', 'alt_text', '~ábra', 'ok'],
  ['image', 'alt_text', 'Más', 'bad'],
  ['image', 'alt_text', 'igen', 'ok'],
  ['image', 'alt_text[image=2]', 'igen', 'bad'],
  ['image', 'alt_text[image=2]', 'nem', 'ok'],
  ['image', 'width[image=3]', '1 cm', 'bad'],
  // tab_stop
  ['tab_stop', 'position[paragraph=2]', '12 cm', 'ok'],
  ['tab_stop', 'position[paragraph=2]', '2 cm', 'ok'],
  ['tab_stop', 'position[paragraph=2]', '10 cm', 'bad'],
  ['tab_stop', 'type[paragraph=2]', 'jobbra', 'ok'],
  ['tab_stop', 'type[paragraph=2]', 'tizedes', 'bad'],
  ['tab_stop', 'leader[paragraph=2]', 'pont', 'ok'],
  ['tab_stop', 'leader[paragraph=2]', 'kötőjel', 'bad'],
  ['tab_stop', 'position[paragraph=5]', '5 cm', 'ok'],
  ['tab_stop', 'type[style=Idézet]', 'középre', 'ok'],
  ['tab_stop', 'position[paragraph=1]', '5 cm', 'bad'],
  // list_format
  ['list_format', 'type[paragraph=6]', 'felsorolás', 'ok'],
  ['list_format', 'type[paragraph=6]', 'számozás', 'bad'],
  ['list_format', 'level[paragraph=6]', '1', 'ok'],
  ['list_format', 'level[paragraph=6]', '2', 'bad'],
  ['list_format', 'symbol[paragraph=6]', '•', 'ok'],
  ['list_format', 'symbol[paragraph=6]', '-', 'bad'],
  ['list_format', 'type[paragraph=7]', 'number', 'ok'],
  ['list_format', 'level[paragraph=7]', '2', 'ok'],
  ['list_format', 'symbol[paragraph=7]', '%2)', 'ok'],
  ['list_format', 'type[paragraph=1]', 'felsorolás', 'bad'],
  // section: az 1. szakasz azonos
  ['section', 'columns', '1', 'ok'],
  ['section', 'columns', '2', 'bad'],
  ['section', 'page_orientation', 'álló', 'ok'],
  ['section', 'page_orientation[section=1]', 'fekvő', 'bad'],
  ['section', 'break_before[section=1]', 'igen', 'ok'],
  ['section', 'columns[section=2]', '2', 'ok'],
  ['section', 'page_orientation[section=2]', 'fekvő', 'ok'],
  ['section', 'page_orientation[section=2]', 'álló', 'bad'],
  ['section', 'columns[section=9]', '1', 'bad'],
]

// A formatumok kozti kulonbseg: az 1. fajlban a 2. szakasz folyamatos (docx), az odt-ben uj oldalon kezdodik
// (mesteroldal-valtas), es csak az odt-ben van 3. (text:section) szakasz.
const DOCX_ONLY: readonly Case[] = [
  ['section', 'break_before[section=2]', 'nem', 'ok'],
  ['section', 'break_before[section=2]', 'igen', 'bad'],
  ['section', 'break_before[section=2]', 'folyamatos', 'ok'],
  ['section', 'columns[section=3]', '1', 'bad'],
]
const ODT_ONLY: readonly Case[] = [
  ['section', 'break_before[section=2]', 'igen', 'ok'],
  ['section', 'break_before[section=2]', 'nem', 'bad'],
  ['section', 'columns[section=3]', '3', 'ok'],
  ['section', 'break_before[section=3]', 'folyamatos', 'ok'],
  ['section', 'page_orientation[section=3]', 'fekvő', 'ok'],
  ['document_table', 'width[table=2]', '10 cm', 'ok'],
]

for (const [format, extra] of [
  ['docx', DOCX_ONLY],
  ['odt', ODT_ONLY],
] as const) {
  test.describe(`Dokumentum-vizsgálatok (${format})`, () => {
    const cases = [...COMMON, ...extra]
    let evaluation: Evaluation

    test.beforeAll(() => {
      evaluation = evaluate(`pw-dok-minta.${format}`, cases)
    })

    test(`@regression minden eset a vart eredmenyt adja (${format})`, () => {
      expect(evaluation.items).toHaveLength(cases.length)
      const mismatches = cases.flatMap(([type, property, expected, state], index) => {
        const actual = evaluation.items[index]?.state
        return actual === state ? [] : [`${type} ${property} = ${expected}: vart ${state}, kapott ${String(actual)} (${String(evaluation.items[index]?.found)})`]
      })
      expect(mismatches).toEqual([])
    })

    test(`@regression a bad pontnal a "found" a talalt erteket mutatja, ha volt mit vizsgalni (${format})`, () => {
      const index = cases.findIndex(([type, property, expected]) => type === 'page_setup' && property === 'page_size' && expected === 'Letter')
      expect(evaluation.items[index]?.found).toBe('Lapméret: A4, álló')
      const missing = cases.findIndex(([, property]) => property === 'font[paragraph=99]')
      expect(evaluation.items[missing]?.found).toBeNull()
    })

    test(`@regression a facts kitoltott (${format})`, () => {
      const facts = Object.fromEntries(evaluation.facts.map((fact) => [fact.label, fact.value]))
      expect(facts['Lapméret']).toBe('A4, álló')
      expect(facts['Margók']).toBe('felül 2,5 cm, alul 2 cm, balra 3 cm, jobbra 2 cm')
      expect(facts['Alapbetű']).toBe('Times New Roman, 12 pt')
      expect(facts['Táblázatok száma']).toBe('2')
      expect(facts['Képek']).toContain('2')
      expect(facts['Használt stílusok']).toBeTruthy()
    })
  })
}

test.describe('Dokumentum-vizsgálatok: Letter lap', () => {
  for (const format of ['docx', 'odt'] as const) {
    test(`@regression a Letter lap nem A4 (${format})`, () => {
      const result = evaluate(`pw-dok-letter.${format}`, [
        ['page_setup', 'page_size', 'Letter', 'ok'],
        ['page_setup', 'page_size', 'A4', 'bad'],
        ['page_setup', 'margin_left', '2,54 cm', 'ok'],
      ])
      expect(result.items.map((item) => item.state)).toEqual(['ok', 'bad', 'ok'])
      expect(result.facts.find((fact) => fact.label === 'Lapméret')?.value).toBe('Letter, álló')
    })
  }
})

/** pw-dok-konvertalt*.odt: Letter, 2 hasab, 2,54 cm margo; 1. tablazat 1 sor (beagyazott nem szamit), 2. tablazat 3 sor. */
const CONVERTED_CASES: readonly Case[] = [
  ['page_setup', 'page_size', 'Letter', 'ok'],
  ['page_setup', 'page_size', 'A4', 'bad'],
  ['page_setup', 'margin_left', '2,54 cm', 'ok'],
  ['page_setup', 'margin_left', '2 cm', 'bad'],
  ['section', 'columns', '2', 'ok'],
  ['section', 'columns[section=1]', '1', 'bad'],
  ['section', 'columns[section=2]', '2', 'bad'],
  ['document_table', 'rows[table=1]', '1', 'ok'],
  ['document_table', 'rows[table=2]', '3', 'ok'],
  ['document_table', 'rows[table=3]', '2', 'bad'],
]

/** A BACKEND.md 7.6 listaja: minden eset pozitiv es negativ valtozata, mindket formatumon azonos ertekkel. */
const HTTP_CASES: readonly Case[] = [
  ['page_setup', 'page_size', 'A4', 'ok'],
  ['page_setup', 'page_size', 'Letter', 'bad'],
  ['page_setup', 'orientation', 'álló', 'ok'],
  ['page_setup', 'orientation', 'fekvő', 'bad'],
  ['page_setup', 'margin_top', '2,5 cm', 'ok'],
  ['page_setup', 'margin_top', '3 cm', 'bad'],
  ['character_format', 'font[heading=1]', 'Arial', 'ok'],
  ['character_format', 'font_size[heading=1]', '12', 'bad'],
  ['character_format', 'bold[heading=1]', 'igen', 'ok'],
  ['character_format', 'font[paragraph=2]', 'Verdana', 'ok'],
  ['character_format', 'font_size[paragraph=2]', '12', 'bad'],
  ['character_format', 'bold[paragraph=2]', 'nem', 'bad'],
  ['paragraph_format', 'alignment[paragraph=2]', 'sorkizárt', 'ok'],
  ['paragraph_format', 'alignment[paragraph=2]', 'jobbra', 'bad'],
  ['paragraph_format', 'line_spacing[paragraph=2]', '1,5', 'ok'],
  ['paragraph_format', 'line_spacing[paragraph=2]', '2', 'bad'],
  ['style', 'applied[paragraph=5]', 'Idézet', 'ok'],
  ['style', 'applied[paragraph=5]', 'Címsor 1', 'bad'],
  ['document_table', 'rows', '3', 'ok'],
  ['document_table', 'rows', '5', 'bad'],
  ['document_table', 'columns', '2', 'ok'],
  ['document_table', 'columns', '4', 'bad'],
  ['image', 'aspect_ratio', '2', 'ok'],
  ['image', 'aspect_ratio', '1', 'bad'],
  ['image', 'width', '8 cm', 'ok'],
  ['image', 'width', '4 cm', 'bad'],
  ['tab_stop', 'position[paragraph=2]', '12 cm', 'ok'],
  ['tab_stop', 'position[paragraph=2]', '9 cm', 'bad'],
  ['tab_stop', 'leader[paragraph=2]', 'pont', 'ok'],
  ['tab_stop', 'leader[paragraph=2]', 'aláhúzás', 'bad'],
  ['section', 'columns', '1', 'ok'],
  ['section', 'columns[section=2]', '2', 'ok'],
  ['section', 'columns[section=2]', '3', 'bad'],
]

test.describe('Dokumentum-vizsgálatok: LibreOffice-konvertált odt', () => {
  test('@regression az első használt mesteroldal az 1. szakasz, nincs szellem-szakasz (bekezdés)', () => {
    const result = evaluate('pw-dok-konvertalt.odt', CONVERTED_CASES)
    expect(result.items.map((item) => item.state)).toEqual(CONVERTED_CASES.map(([, , , state]) => state))
    expect(result.facts.find((fact) => fact.label === 'Lapméret')?.value).toBe('Letter, álló')
  })

  test('@regression az első táblázat stílusának mesteroldala is az 1. szakaszt adja', () => {
    const result = evaluate('pw-dok-konvertalt-tabla.odt', CONVERTED_CASES)
    expect(result.items.map((item) => item.state)).toEqual(CONVERTED_CASES.map(([, , , state]) => state))
  })
})

test.describe('Dokumentum-vizsgálatok: a vegponton at', () => {
  test('@regression az A4 docx teljesiti, a Letter nem teljesiti a 6. feladat lapmeret-pontját', async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const path = `admin/exercises/${String(SEEDED.typed.docUpload.id)}/rubric-check`

    const a4 = await admin.postMultipart<{ data: { status: string; score: number; facts: { label: string }[] } }>(path, {}, fixtureFile('documents/pw-dok-minta.docx'))
    expect(a4.status).toBe(200)
    expect(a4.body.data.status).toBe('evaluated')
    expect(a4.body.data.score).toBe(SEEDED.typed.docUpload.rubricTotal)
    expect(a4.body.data.facts.map((fact) => fact.label)).toContain('Lapméret')

    const letter = await admin.postMultipart<{ data: { score: number } }>(path, {}, fixtureFile('documents/pw-dok-letter.docx'))
    expect(letter.status).toBe(200)
    expect(letter.body.data.score).toBe(0)
  })

  test('@regression a serult es a DOCTYPE-os docx failed allapotot kap, nem 500-at', async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const path = `admin/exercises/${String(SEEDED.typed.docUpload.id)}/rubric-check`

    for (const file of ['documents/pw-dok-serult.docx', 'documents/pw-dok-doctype.docx']) {
      const result = await admin.postMultipart<{ data: { status: string; score: number } }>(path, {}, fixtureFile(file))
      expect(result.status, file).toBe(200)
      expect(result.body.data.status, file).toBe('failed')
      expect(result.body.data.score, file).toBe(0)
    }
  })

  test('@regression ismeretlen tulajdonsag, rossz ertek es rossz szelektor 422 a szerkeszteskor', async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const path = `admin/exercises/${String(SEEDED.typed.docUpload.id)}/rubric-items`
    const base = { label: 'PW tiltott pont', group: 'PW', points: 1, mode: 'auto' }

    const bad: [string, string, string][] = [
      ['character_format', 'villogas', 'igen'],
      ['character_format', 'font_size', 'nagy'],
      ['character_format', 'bold[table=1]', 'igen'],
      ['page_setup', 'page_size', 'A9'],
      ['page_setup', 'margin_top[paragraph=1]', '2 cm'],
      ['style', 'exists', 'igen'],
      ['image', 'count[image=1]', '2'],
      ['document_table', 'rows[table=0]', '2'],
    ]

    for (const [check_type, property, expected] of bad) {
      const response = await admin.post<{ errors?: Record<string, string[]> }>(path, { ...base, check_type, property, expected })
      expect(response.status, `${check_type} ${property}=${expected}`).toBe(422)
      expect(response.body.errors?.property ?? response.body.errors?.expected, `${check_type} ${property}`).toBeTruthy()
    }
  })

  test('@regression a BACKEND.md 7.6 esetei a rubric-check vegponton at, ideiglenes doc_upload feladattal (docx es odt)', async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const created = await createExercise(admin, {
      lesson_id: SEEDED.typed.sheetUpload.lessonId,
      title: 'PW WP4: ideiglenes dokumentum-feladat',
      description: 'Playwright API teszt: a teszt végén törlődik.',
      level: 'kozep',
      difficulty: 1,
      kind: 'doc_upload',
      allowed_languages: [],
      spec: { accepted_extensions: ['.docx', '.odt'] },
    })
    expect(created.status, JSON.stringify(created.errorBody)).toBe(201)
    const exerciseId = created.body.data.id

    try {
      const ids: number[] = []
      for (const [type, property, expected] of HTTP_CASES) {
        const item = await admin.post<{ data: { id: number } }>(`admin/exercises/${String(exerciseId)}/rubric-items`, {
          label: `${type} ${property}`,
          group: 'PW',
          check_type: type,
          property,
          expected,
          points: 1,
          mode: 'auto',
        })
        expect(item.status, `${type} ${property}=${expected}: ${JSON.stringify(item.errorBody)}`).toBe(201)
        ids.push(item.body.data.id)
      }

      for (const format of ['docx', 'odt'] as const) {
        const result = await admin.postMultipart<{ data: { status: string; items: { rubric_item_id: number; state: State }[] } }>(
          `admin/exercises/${String(exerciseId)}/rubric-check`,
          {},
          fixtureFile(`documents/pw-dok-minta.${format}`)
        )
        expect(result.status, format).toBe(200)
        expect(result.body.data.status, format).toBe('evaluated')
        const states = new Map(result.body.data.items.map((item) => [item.rubric_item_id, item.state]))
        const mismatches = HTTP_CASES.flatMap(([type, property, expected, state], index) => {
          const actual = states.get(ids[index] ?? -1)
          return actual === state ? [] : [`${format}: ${type} ${property}=${expected}: vart ${state}, kapott ${String(actual)}`]
        })
        expect(mismatches).toEqual([])
      }
    } finally {
      await deleteExercise(admin, exerciseId)
    }
  })
})
