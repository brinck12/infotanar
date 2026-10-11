import type { ApiClient } from '../../src/api/ApiClient'
import { adminAccount } from '../../src/api/areas/accounts'
import { fixtureFile } from '../../src/data/files'
import { expect, test } from '../../src/fixtures'

/**
 * WP5: a bemutato- (pptx, odp), vektor- (svg) es kepvizsgalatok (png) a valodi
 * backenden, az ertekelolap-probaval (POST /admin/exercises/{id}/rubric-check).
 *
 * Minden teszt egy ideiglenes `visual_upload` feladatot hoz letre az admin API-n
 * at, rakot egy-egy ertekelolap-pontot minden esethez, es a fixture-fajlt a
 * probara kuldi. A web (html, css) vizsgalat nem szerepel: nincs olyan feladatfajta,
 * amely html-t vagy css-t fogadna (a `visual_upload` kiterjesztesei: .pptx .odp
 * .svg .png), ezeket a `php artisan filetasks:evaluate` fedi (lasd a jelentest).
 *
 * A fixture-fajlokat a tests/fixtures/files/slides-web/generate.ts allitja elo;
 * PowerPointban, Impressben es bongeszoben soha nem nyitottuk meg oket.
 *
 * A feladat letrehozasa a WP1 csomagra (a `kind` mezo az admin feladat-API-ban)
 * var: amig az nincs a backenden, a tesztek `fixme`-k.
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

const WP1_FIXME = 'A feladat létrehozása `kind` mezővel a WP1 csomagra vár (admin feladat-API); a merge után a teszt magától fut.'

/** Letrehoz egy visual_upload feladatot; null, ha a backend (WP1 nélkül) nem ismeri a fajtát. */
async function createVisualExercise(admin: ApiClient): Promise<number | null> {
  const lesson = 5
  const created = await admin.post<Envelope<{ id: number; kind?: string }>>('admin/exercises', {
    lesson_id: lesson,
    title: `PW WP5 ${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}`,
    description: 'Ideiglenes feladat a bemutató- és vektorvizsgálatok teszteléséhez.',
    level: 'kozep',
    difficulty: 1,
    kind: 'visual_upload',
    allowed_languages: [],
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

  if (created.status !== 201 && created.status !== 200) return null
  const body = created.body as Envelope<{ id: number; kind?: string }>
  return body.data.kind === 'visual_upload' ? body.data.id : null
}

/** A feladat azonositoja; a WP1 nelkuli backenden a hivo teszt `fixme`-vel megall. */
async function requireVisualExercise(admin: ApiClient): Promise<number> {
  const exercise = await createVisualExercise(admin)
  if (exercise === null) {
    test.fixme(true, WP1_FIXME)
    throw new Error('A teszt fixme-vel megallt.')
  }

  return exercise
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
  const exercise = await requireVisualExercise(admin)

  try {
    await addItems(admin, exercise, cases)
    const check = await admin.postMultipart<Envelope<RubricResult>>(`admin/exercises/${String(exercise)}/rubric-check`, {}, fixtureFile(file))
    expect(check.status).toBe(200)

    return check.body.data
  } finally {
    await admin.delete(`admin/exercises/${String(exercise)}`)
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

  test('nem támogatott tulajdonság szerkesztéskor 422 a property mezőn', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const exercise = await requireVisualExercise(admin)

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
      await admin.delete(`admin/exercises/${String(exercise)}`)
    }
  })

  // A html/css vizsgálatnak nincs feltöltő feladatfajtája (visual_upload: .pptx .odp .svg .png), ezért
  // az API-n át nem tesztelhető; a WebCheck-et a `php artisan filetasks:evaluate` esettáblája fedi.
})
