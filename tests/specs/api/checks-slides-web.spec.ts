import { randomUUID } from 'node:crypto'
import type { ApiClient } from '../../src/api/ApiClient'
import { adminAccount } from '../../src/api/areas/accounts'
import { createExercise, deleteExercise } from '../../src/api/areas/typedTasks'
import { SEEDED } from '../../src/data'
import { fixtureFile, uploadOf } from '../../src/data/files'
import { expect, test } from '../../src/fixtures'
import { evaluateWithCli, type CliResult } from '../../src/support/filetasksCli'

/**
 * WP5: a bemutato- (pptx, odp), vektor- (svg) es kepvizsgalatok (png) a valodi
 * backenden, az ertekelolap-probaval (POST /admin/exercises/{id}/rubric-check).
 *
 * Minden teszt egy ideiglenes `visual_upload` feladatot hoz letre az admin API-n
 * at, rakot egy-egy ertekelolap-pontot minden esethez, es a fixture-fajlt a
 * probara kuldi. A html es css vizsgalat nincs ebben a reszben: nincs olyan feladatfajta,
 * amely html-t vagy css-t fogadna (a `visual_upload` kiterjesztesei: .pptx .odp .svg .png), ezeket
 * (es a hostile bemeneteket) a fajl alja `php artisan filetasks:evaluate`-en at fedi.
 *
 * A fixture-fajlokat a tests/fixtures/files/slides-web/generate.ts allitja elo;
 * PowerPointban, Impressben es bongeszoben soha nem nyitottuk meg oket.
 */

interface Envelope<T> {
  data: T
}

interface RubricResult {
  status: string
  error: string | null
  items: { label: string; state: string; found: string | null }[]
  facts: { label: string; value: string }[]
}

interface Case {
  type: string
  property: string
  expected: string
  /** Teljesul-e ('ok') vagy nem ('bad'). */
  ok: boolean
}

/** Letrehoz egy visual_upload feladatot az admin API-n; sikertelen letrehozasnal a teszt elbukik. */
async function createVisualExercise(admin: ApiClient): Promise<number> {
  const created = await createExercise(admin, {
    lesson_id: SEEDED.typed.sheetUpload.lessonId,
    title: `PW WP5 ${randomUUID()}`,
    description: 'Ideiglenes feladat a bemutató- és vektorvizsgálatok teszteléséhez.',
    level: 'kozep',
    difficulty: 1,
    kind: 'visual_upload',
    spec: {
      steps: ['Töltsd fel a fájlt.'],
      deliverable: 'bemutato',
      accepted_extensions: ['.pptx', '.odp', '.svg', '.png'],
      software: [],
      exam_reference: null,
      exam_points: null,
      raw_points: null,
    },
    is_published: false,
  })
  expect(created.status, JSON.stringify(created.body)).toBe(201)
  expect(created.body.data.kind).toBe('visual_upload')

  return created.body.data.id
}

async function addItems(admin: ApiClient, exercise: number, cases: Case[]): Promise<void> {
  for (const [index, item] of cases.entries()) {
    const created = await admin.post(`admin/exercises/${String(exercise)}/rubric-items`, {
      label: `eset ${String(index)}`,
      group: 'Próba',
      check_type: item.type,
      property: item.property,
      expected: item.expected,
      points: 1,
      mode: 'auto',
    })
    expect(created.status, `${item.type}|${item.property}|${item.expected}`).toBe(201)
  }
}

async function runCases(admin: ApiClient, file: string, cases: Case[]): Promise<RubricResult> {
  const exercise = await createVisualExercise(admin)

  try {
    await addItems(admin, exercise, cases)
    const check = await admin.postMultipart<Envelope<RubricResult>>(`admin/exercises/${String(exercise)}/rubric-check`, {}, fixtureFile(file))
    expect(check.status).toBe(200)

    return check.body.data
  } finally {
    await deleteExercise(admin, exercise)
  }
}

function expectStates(result: RubricResult, cases: Case[]): void {
  expect(result.status).toBe('evaluated')
  expect(result.items).toHaveLength(cases.length)
  for (const [index, item] of cases.entries()) {
    const actual = result.items[index]
    expect(actual?.state, `${item.type}|${item.property}|${item.expected} (${actual?.found ?? 'nincs found'})`).toBe(item.ok ? 'ok' : 'bad')
  }
}

const c = (type: string, property: string, expected: string, ok: boolean): Case => ({ type, property, expected, ok })

/** Ugyanazok az esetek a pptx es az odp fixture-re (azonos tartalom). */
const PRESENTATION_CASES: Case[] = [
  c('slide', 'count', '2', true),
  c('slide', 'count', '3', false),
  c('slide', 'width', '33.87cm', true),
  c('slide', 'width', '25cm', false),
  c('slide', 'height', '19,05 cm', true),
  c('slide', 'background[slide=1]', 'piros', true),
  c('slide', 'background[slide=1]', '#0000FF', false),
  c('slide', 'background_type[slide=2]', 'gradient', true),
  c('slide', 'background_type[slide=1]', 'gradient', false),
  c('slide', 'title_size[slide=1]', '44', true),
  c('slide', 'title_size[slide=1]', '32pt', false),
  c('slide', 'transition[slide=2]', 'áttűnés', true),
  c('slide', 'transition[slide=1]', 'fade', false),
  c('slide', 'transition[slide=1]', 'nincs', true),
  c('slide', 'loop', 'igen', true),
  c('slide', 'loop', 'nem', false),
  c('slide', 'master_font', 'Arial', true),
  c('slide', 'master_font', 'Calibri', false),
  c('animation', 'effect[slide=1,shape=2]', 'beúszás', true),
  c('animation', 'effect[slide=1,shape=2]', 'fade', false),
  c('animation', 'duration[slide=1,shape=2]', '0,5', true),
  c('animation', 'duration[slide=1,shape=2]', '2', false),
  c('animation', 'delay[slide=1,shape=2]', '1s', true),
  c('animation', 'delay[slide=1,shape=2]', '0', false),
  c('animation', 'trigger[slide=1,shape=2]', 'kattintásra', true),
  c('animation', 'trigger[slide=1,shape=2]', 'after', false),
  c('animation', 'effect[slide=2]', 'appear', false),
  c('shape', 'count[slide=1]', '2', true),
  c('shape', 'count[slide=1]', '5', false),
  c('shape', 'type[slide=1,shape=2]', 'téglalap', true),
  c('shape', 'type[slide=1,shape=2]', 'ellipszis', false),
  c('shape', 'type[slide=1,shape=1]', 'cím', true),
  c('shape', 'fill[slide=1,shape=2]', '#00B050', true),
  c('shape', 'fill[slide=1,shape=2]', 'piros', false),
  c('shape', 'transparency[slide=1,shape=2]', '30%', true),
  c('shape', 'transparency[slide=1,shape=2]', '0', false),
  c('shape', 'text[slide=1,shape=2]', '~zöld', true),
  c('shape', 'text[slide=1,shape=2]', 'Kék doboz', false),
  c('image', 'count', '1', true),
  c('image', 'count', '2', false),
  c('image', 'width[image=1]', '8cm', true),
  c('image', 'width[image=1]', '5cm', false),
  c('image', 'height[slide=2]', '4cm', true),
  c('image', 'aspect_ratio[image=1]', '2:1', true),
  c('image', 'aspect_ratio[image=1]', '4:3', false),
  c('image', 'alt_text[image=1]', 'Logo', true),
  c('image', 'alt_text[image=1]', 'Más', false),
]

const SVG_CASES: Case[] = [
  c('shape', 'count', '3', true),
  c('shape', 'count', '4', false),
  c('shape', 'type[shape=1]', 'téglalap', true),
  c('shape', 'type[shape=2]', 'kör', true),
  c('shape', 'type[shape=2]', 'téglalap', false),
  c('shape', 'fill[shape=1]', 'piros', true),
  c('shape', 'fill[shape=2]', '#0000FF', true),
  c('shape', 'fill[shape=2]', 'piros', false),
  c('shape', 'transparency[shape=2]', '50', true),
  c('shape', 'transparency[shape=2]', '10', false),
  c('shape', 'text[shape=3]', 'Szia', true),
  c('shape', 'text[shape=3]', 'Hello', false),
  c('image', 'count', '1', true),
  c('image', 'width', '40mm', true),
  c('image', 'width', '4 cm', true),
  c('image', 'height', '3cm', false),
  c('image', 'alt_text', 'igen', true),
  c('image', 'alt_text', '~logo', true),
  c('image', 'aspect_ratio', '2', true),
]

const PNG_CASES: Case[] = [
  c('image', 'width', '80', true),
  c('image', 'width', '80px', true),
  c('image', 'height', '40', true),
  c('image', 'width', '100', false),
  c('image', 'aspect_ratio', '2:1', true),
  c('image', 'aspect_ratio', '4:3', false),
  c('image', 'count', '1', true),
  c('image', 'width[image=2]', '80', false),
]

test.describe('Bemutató-, vektor- és képvizsgálatok (rubric-check)', () => {
  test('pptx: dia, animáció, alakzat és kép tulajdonságai', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const result = await runCases(admin, 'slides-web/pw-bemutato.pptx', PRESENTATION_CASES)
    expectStates(result, PRESENTATION_CASES)
    expect(result.facts.map((fact) => fact.label)).toContain('Diák száma')
  })

  test('odp: ugyanazok az esetek, mint a pptx-nél', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const result = await runCases(admin, 'slides-web/pw-bemutato.odp', PRESENTATION_CASES)
    expectStates(result, PRESENTATION_CASES)
    expect(result.items.length).toBeGreaterThan(0)
  })

  test('svg: alakzatok és képek tulajdonságai', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const result = await runCases(admin, 'slides-web/pw-rajz.svg', SVG_CASES)
    expectStates(result, SVG_CASES)
    expect(result.items.length).toBeGreaterThan(0)
  })

  test('svg DOCTYPE-pal olvashatatlan: failed állapot, egyetlen pont sem fut', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const result = await runCases(admin, 'slides-web/pw-rajz-doctype.svg', [c('shape', 'count', '3', true)])
    expect(result.status).toBe('failed')
    expect(result.error).not.toBeNull()
  })

  test('png: méret, képarány és darabszám', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const result = await runCases(admin, 'slides-web/pw-kep-80x40.png', PNG_CASES)
    expectStates(result, PNG_CASES)
    expect(result.items.length).toBeGreaterThan(0)
  })

  test('html és css fájlt a végpont nem fogad el (a feladatfajták kiterjesztés-listáján nincs): 422 a file mezőn', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const exercise = await createVisualExercise(admin)

    try {
      for (const file of ['slides-web/pw-oldal.html', 'slides-web/pw-torzs.html', 'slides-web/pw-stilus.css']) {
        const check = await admin.postMultipart<{ errors?: Record<string, string[]> }>(`admin/exercises/${String(exercise)}/rubric-check`, {}, fixtureFile(file))
        expect(check.status, file).toBe(422)
        expect(Object.keys(check.body.errors ?? {}), file).toContain('file')
      }
    } finally {
      await deleteExercise(admin, exercise)
    }
  })

  test('hostile svg a végponton át: pontosvesszős <style> lineáris idő alatt feldolgozódik', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const exercise = await createVisualExercise(admin)

    try {
      await addItems(admin, exercise, [c('shape', 'count', '1', true)])
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style>${';'.repeat(200_000)}</style><rect width="1" height="1"/></svg>`
      const started = Date.now()
      const check = await admin.postMultipart<Envelope<RubricResult>>(`admin/exercises/${String(exercise)}/rubric-check`, {}, uploadOf('pontosvesszo.svg', svg))

      expect(check.status).toBe(200)
      expect(check.body.data.status).toBe('evaluated')
      expect(check.body.data.items[0]?.state).toBe('ok')
      expect(Date.now() - started).toBeLessThan(HOSTILE_BUDGET_MS)
    } finally {
      await deleteExercise(admin, exercise)
    }
  })

  test('hostile svg a végponton át: sok stílusszabály olvashatatlan (failed), nem 500', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const exercise = await createVisualExercise(admin)

    try {
      await addItems(admin, exercise, [c('shape', 'count', '1', true)])
      const rules = Array.from({ length: 2_500 }, (_, index) => `.c${String(index)}{fill:red}`).join('')
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style>${rules}</style><rect class="c1" width="1" height="1"/></svg>`
      const check = await admin.postMultipart<Envelope<RubricResult>>(`admin/exercises/${String(exercise)}/rubric-check`, {}, uploadOf('szabalyok.svg', svg))

      expect(check.status).toBe(200)
      expect(check.body.data.status).toBe('failed')
      expect(check.body.data.error).not.toBeNull()
    } finally {
      await deleteExercise(admin, exercise)
    }
  })

  test('nem támogatott tulajdonság szerkesztéskor 422 a property mezőn', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const exercise = await createVisualExercise(admin)

    try {
      for (const bad of [
        c('slide', 'szín', 'piros', false),
        c('slide', 'count[slide=1]', '2', false),
        c('animation', 'effect[shape=1]', 'fade', false),
        c('shape', 'fill[slide=1,shape=1]', 'nemszín', false),
        c('web', 'css[h1]', 'red', false),
      ]) {
        const created = await admin.post<{ errors?: Record<string, string[]> }>(`admin/exercises/${String(exercise)}/rubric-items`, {
          label: 'rossz',
          group: '',
          check_type: bad.type,
          property: bad.property,
          expected: bad.expected,
          points: 1,
          mode: 'auto',
        })
        expect(created.status, bad.property).toBe(422)
        expect(Object.keys(created.body.errors ?? {}), bad.property).toContain('property')
      }
    } finally {
      await deleteExercise(admin, exercise)
    }
  })
})

const WEB_CASES: Case[] = [
  c('web', 'title', 'PW oldal', true),
  c('web', 'title', 'Más', false),
  c('web', 'title', '~oldal', true),
  c('web', 'element_count[h1]', '1', true),
  c('web', 'element_count[p]', '2', true),
  c('web', 'element_count[p]', '3', false),
  c('web', 'element_count[.kiemelt]', '1', true),
  c('web', 'element_count[p.kiemelt]', '>=1', true),
  c('web', 'element_count[#x]', '0', true),
  // A h1 alap szine piros, a @media blokkban zold: a feltetel nelkuli szabaly szamit.
  c('web', 'css[h1.color]', 'piros', true),
  c('web', 'css[h1.color]', '#00ff00', false),
  c('web', 'css[h1.font-size]', '24px', true),
  c('web', 'css[h1.font-size]', '18pt', true),
  c('web', 'css[h1.margin-left]', '20px', true),
  c('web', 'css[.kiemelt.color]', 'kék', true),
  c('web', 'css[.kiemelt.font-family]', 'Arial, sans-serif', true),
  c('web', 'css[h1.border]', 'x', false),
  c('web', 'class_used[kiemelt]', 'igen', true),
  c('web', 'class_used[nincs]', 'igen', false),
  c('web', 'class_used[nincs]', 'nem', true),
  c('web', 'link[https://example.com]', 'igen', true),
  c('web', 'link[https://example.com]', '~példa', true),
  c('web', 'link[https://nincs.hu]', 'igen', false),
  c('web', 'img_size[1]', '200x100', true),
  c('web', 'img_size[1]', '100x100', false),
  c('web', 'img_size[2]', '1x1', false),
]

const CSS_CASES: Case[] = [
  c('web', 'css[h1.color]', 'piros', true),
  c('web', 'css[h1.color]', '#00ff00', false),
  c('web', 'css[.kiemelt.color]', 'blue', true),
  c('web', 'title', 'x', false),
]

/** DOCTYPE nélküli HTML-töredék: nincs <html>, <head>, <title>. */
const FRAGMENT_CASES: Case[] = [c('web', 'element_count[h1]', '1', true), c('web', 'element_count[p]', '1', true), c('web', 'title', 'x', false)]

function cliStates(result: CliResult, cases: Case[]): number {
  expect(result.status).toBe('evaluated')
  expect(result.items).toHaveLength(cases.length)
  for (const [index, item] of cases.entries()) {
    const actual = result.items[index]
    expect(actual?.state, `${item.type}|${item.property}|${item.expected} (${actual?.found ?? 'nincs found'})`).toBe(item.ok ? 'ok' : 'bad')
  }

  return cases.length
}

/** Egy hostile bemenet feldolgozása ennyi ms alatt végezzen (a környezet falióra-korlátja 25 s). */
const HOSTILE_BUDGET_MS = 10_000

/**
 * A `php artisan filetasks:evaluate` parancson át: ide kerül az a két család, amelyet semmilyen
 * feltöltős feladatfajta nem fogad (html, css), a bemutató- és vektorfixture-ok ugyanazon esetei, valamint
 * a hostile bemenetek. A parancs ugyanazt a FileEvaluator-t és olvasókat futtatja, mint a rubric-check.
 */
test.describe('Vizsgálatok a filetasks:evaluate parancson át (html, css, hostile bemenetek)', () => {
  const fixtures = (name: string): Buffer => fixtureFile(`slides-web/${name}`).buffer

  test('html: cím, elemszám, CSS (komment és @media mellett), osztály, link, képméret', { tag: '@regression' }, () => {
    const result = evaluateWithCli('pw-oldal.html', fixtures('pw-oldal.html'), WEB_CASES)

    cliStates(result, WEB_CASES)
    expect(result.facts.map((fact) => fact.label)).toContain('Oldalcím')
  })

  test('css fájl: szabályok kommenttel, @media és @font-face blokkal', { tag: '@regression' }, () => {
    expect(cliStates(evaluateWithCli('pw-stilus.css', fixtures('pw-stilus.css'), CSS_CASES), CSS_CASES)).toBe(CSS_CASES.length)
  })

  test('DOCTYPE nélküli HTML-töredék is olvasható', { tag: '@regression' }, () => {
    expect(cliStates(evaluateWithCli('pw-torzs.html', fixtures('pw-torzs.html'), FRAGMENT_CASES), FRAGMENT_CASES)).toBe(FRAGMENT_CASES.length)
  })

  test('csak @media blokkban beállított tulajdonságot a hint megnevezi', { tag: '@regression' }, () => {
    const html = '<html><head><style>p { color: blue } @media (max-width: 600px) { p { margin-top: 5px } }</style></head><body><p>a</p></body></html>'
    const cases = [c('web', 'css[p.margin-top]', '5px', false)]
    const result = evaluateWithCli('media.html', html, cases)

    cliStates(result, cases)
    expect(result.items[0]?.found).toContain('@media')
  })

  for (const [file, cases] of [
    ['pw-bemutato.pptx', PRESENTATION_CASES],
    ['pw-bemutato.odp', PRESENTATION_CASES],
    ['pw-rajz.svg', SVG_CASES],
    ['pw-kep-80x40.png', PNG_CASES],
  ] as const) {
    test(`${file}: az esettábla a parancson át is egyezik`, { tag: '@regression' }, () => {
      expect(cliStates(evaluateWithCli(file, fixtures(file), cases), cases)).toBe(cases.length)
    })
  }

  test('svg DOCTYPE-pal olvashatatlan: failed, hibaüzenettel', { tag: '@regression' }, () => {
    const result = evaluateWithCli('pw-rajz-doctype.svg', fixtures('pw-rajz-doctype.svg'), [c('shape', 'count', '3', true)])

    expect(result.status).toBe('failed')
    expect(result.error).not.toBeNull()
  })

  test('hostile: pontosvesszőkből álló CSS-fájl lineáris idő alatt feldolgozódik', { tag: '@regression' }, () => {
    const result = evaluateWithCli('pontosvesszo.css', 'a;'.repeat(100_000), [c('web', 'css[h1.color]', 'piros', false)])

    expect(result.status).toBe('evaluated')
    expect(result.elapsedMs).toBeLessThan(HOSTILE_BUDGET_MS)
  })

  test('hostile: pontosvesszőkből álló svg <style> lineáris idő alatt feldolgozódik', { tag: '@regression' }, () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style>${';'.repeat(200_000)}</style><rect width="1" height="1"/></svg>`
    const result = evaluateWithCli('pontosvesszo.svg', svg, [c('shape', 'count', '1', true)])

    expect(result.status).toBe('evaluated')
    expect(result.elapsedMs).toBeLessThan(HOSTILE_BUDGET_MS)
  })

  test('hostile: túl hosszú CSS olvashatatlan, tiszta failed', { tag: '@regression' }, () => {
    const result = evaluateWithCli('hatalmas.css', `h1 { color: red }\n${'/* x */'.repeat(60_000)}`, [c('web', 'css[h1.color]', 'piros', true)])

    expect(result.status).toBe('failed')
    expect(result.elapsedMs).toBeLessThan(HOSTILE_BUDGET_MS)
  })

  test('hostile: sok stílusszabályos svg olvashatatlan (szabálykorlát)', { tag: '@regression' }, () => {
    const rules = Array.from({ length: 2_500 }, (_, index) => `.c${String(index)}{fill:red}`).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style>${rules}</style><rect class="c1" width="1" height="1"/></svg>`
    const result = evaluateWithCli('szabalyok.svg', svg, [c('shape', 'count', '1', true)])

    expect(result.status).toBe('failed')
    expect(result.elapsedMs).toBeLessThan(HOSTILE_BUDGET_MS)
  })

  test('hostile: sok elemre sok szabály nem lassít (indexelt illesztés)', { tag: '@regression' }, () => {
    const rules = Array.from({ length: 1_900 }, (_, index) => `.c${String(index)}{fill:red}`).join('')
    const rects = Array.from({ length: 5_000 }, (_, index) => `<rect class="c${String(index % 1_900)}" width="1" height="1"/>`).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style>${rules}</style>${rects}</svg>`
    const cases = [c('shape', 'count', '5000', true)]
    const result = evaluateWithCli('sok.svg', svg, cases)

    cliStates(result, cases)
    expect(result.elapsedMs).toBeLessThan(HOSTILE_BUDGET_MS)
  })
})
