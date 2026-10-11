import { adminAccount, premiumStudent, verifiedStudent } from '../../src/api/areas/accounts'
import {
  deleteAttachment,
  download,
  listAttachments,
  studentDownloadUrl,
  uploadAttachment,
  withTamperedSignature,
} from '../../src/api/areas/attachments'
import {
  adminExercise,
  createExercise,
  createTestCase,
  deleteExercise,
  deleteTestCase,
  testCases,
  typedTask,
  updateExercise,
} from '../../src/api/areas/typedTasks'
import type { ApiClient } from '../../src/api/ApiClient'
import type { AdminExercise, AdminExercisePayload } from '../../src/api/types'
import { ECHO_PROGRAM, fixtureFile, FIXTURE_FILES, SEEDED, uploadOf } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const TYPED = SEEDED.typed

/** A PNG fajlok elso nyolc bajtja. */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Minden kotelezo mezo egy uj feladathoz; a lecke publikalt es ingyenes (a tablazatos fixture leckeje). */
const BASE: AdminExercisePayload = {
  lesson_id: TYPED.sheetUpload.lessonId,
  title: 'PW WP1: ideiglenes feladat',
  description: 'Playwright API teszt: a teszt végén törlődik.',
  level: 'kozep',
  difficulty: 1,
}

const UPLOAD_SPEC = { accepted_extensions: ['.xlsx'] }

const WEB_FILE = { name: 'index.html', language: 'html', content: '<title></title>' }

const TITLE_CHECK = { label: 'Az oldal címe „Teszt”', points: 1, type: 'title', value: 'Teszt' }

/**
 * A tesztek altal letrehozott feladatok: mindegyik torlodik a teszt vegen, hogy
 * a kozos fixture adatbazis (feladatszamok, listak) a tobbi specnek valtozatlan maradjon.
 */
const createdExercises: number[] = []

async function newExercise(admin: ApiClient, overrides: AdminExercisePayload = {}): Promise<AdminExercise> {
  const created = await createExercise(admin, { ...BASE, allowed_languages: ['python'], ...overrides })
  if (created.status !== 201) throw new Error(`A feladat letrehozasa sikertelen (${String(created.status)}): ${JSON.stringify(created.errorBody)}`)

  createdExercises.push(created.body.data.id)
  return created.body.data
}

/** Nem szerkesztos fajtahoz: nyelvek nelkul. */
function newTypedExercise(admin: ApiClient, kind: string, overrides: AdminExercisePayload = {}): Promise<AdminExercise> {
  return newExercise(admin, { kind, allowed_languages: [], ...overrides })
}

test.afterEach(async ({ apiClient }) => {
  const admin = await adminAccount(apiClient)

  for (const id of createdExercises.splice(0)) {
    await deleteExercise(admin.client, id)
  }
})

test.describe('Típusos feladat részletei (GET /tasks/{id})', () => {
  test('a táblázatos fájlfeladat a file_task mezőt adja, a nyers pontszám nélkül', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const { status, body } = await typedTask(admin.client, TYPED.sheetUpload.id)

    expect(status).toBe(200)
    expect(body.data).toMatchObject({ kind: 'sheet_upload', locked: false, allowed_languages: [], starter_code: {}, example_test_cases: [] })
    // Nyelv nélküli feladatnál a korlátok üres OBJEKTUMként jönnek, nem üres tömbként.
    expect(body.data.limits).toEqual({})
    expect(Array.isArray(body.data.limits)).toBe(false)

    expect(body.data.file_task).toEqual({
      steps: TYPED.sheetUpload.spec.steps,
      sources: [],
      deliverable: TYPED.sheetUpload.spec.deliverable,
      accepted_extensions: TYPED.sheetUpload.spec.accepted_extensions,
      software: TYPED.sheetUpload.spec.software,
      sample_image_url: expect.stringContaining(`/attachments/${TYPED.sheetUpload.sampleImage.attachmentId}/download?`),
      exam_reference: TYPED.sheetUpload.spec.exam_reference,
      exam_points: TYPED.sheetUpload.spec.exam_points,
    })
    expect(JSON.stringify(body)).not.toContain('raw_points')

    for (const absent of ['sql_task', 'web_task', 'sheet_practice', 'doc_practice', 'sources']) {
      expect(body.data).not.toHaveProperty(absent)
    }
  })

  test('a mintakép aláírt URL-je token nélkül letölt egy PNG-t, elrontott aláírással 403', { tag: '@smoke' }, async ({ apiClient }) => {
    const { body } = await typedTask(apiClient, TYPED.sheetUpload.id)
    const url = body.data.file_task?.sample_image_url ?? ''

    const image = await download(apiClient, url)
    expect(image.status).toBe(200)
    expect(image.body.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true)
    expect(image.body).toHaveLength(TYPED.sheetUpload.sampleImage.size)
    expect(image.headers['content-type']).toContain('image/png')
    // A mintakép <img>-ben jelenik meg, minden más letöltésként; scriptet egyik sem futtathat.
    expect(image.headers['content-disposition']).toContain('inline')
    expect(image.headers['content-disposition']).toContain(TYPED.sheetUpload.sampleImage.name)
    expect(image.headers['x-content-type-options']).toBe('nosniff')
    expect(image.headers['content-security-policy']).toContain('sandbox')
    expect(image.headers['cache-control']).toContain('private')

    expect((await download(apiClient, withTamperedSignature(url))).status).toBe(403)
  })

  test('a weboldal-feladat web_task-ot ad számozott ellenőrzésekkel', { tag: '@regression' }, async ({ apiClient }) => {
    const { body } = await typedTask(apiClient, TYPED.web.id)

    expect(body.data.kind).toBe('web')
    expect(body.data.web_task?.files.map((file) => file.name)).toEqual([TYPED.web.fileName])
    expect(body.data.web_task?.files[0]?.language).toBe('html')
    expect(body.data.web_task?.checks).toEqual([TYPED.web.check])
    expect(typeof body.data.web_task?.checks[0]?.id).toBe('number')
    expect(body.data.web_task?.exam_reference).toBeNull()
    expect(body.data).not.toHaveProperty('file_task')
    expect(body.data).not.toHaveProperty('my_status')
  })

  test('a böngészős táblázat sheet_practice-t ad a kiinduló cellákkal', { tag: '@regression' }, async ({ apiClient }) => {
    const { body } = await typedTask(apiClient, TYPED.sheetBrowser.id)

    expect(body.data.kind).toBe('sheet_browser')
    expect(body.data.sheet_practice).toEqual({
      columns: TYPED.sheetBrowser.columns,
      rows: TYPED.sheetBrowser.rows,
      cells: TYPED.sheetBrowser.cells,
      checks: [TYPED.sheetBrowser.check],
    })
  })

  test('a kódfeladat forrásfájlja letölthető, és a tartalma a feltöltött fájl', { tag: '@smoke' }, async ({ apiClient }) => {
    const { body } = await typedTask(apiClient, TYPED.subtasks.id)
    const source = TYPED.subtasks.source

    expect(body.data.kind).toBe('code')
    expect(body.data.limits).toHaveProperty(TYPED.subtasks.language)
    expect(body.data.sources).toEqual([{ name: source.name, size: source.size, url: expect.stringContaining(`/attachments/${source.attachmentId}/download?`) }])
    // A részfeladatok pontjai nem a feladat leírásában, hanem a futtatás eredményében jelennek meg.
    expect(body.data).not.toHaveProperty('file_task')
    expect(body.data).not.toHaveProperty('sql_task')

    const file = await download(apiClient, body.data.sources?.[0]?.url ?? '')
    expect(file.status).toBe(200)
    expect(file.body.toString('utf8')).toBe(source.content)
    expect(file.headers['content-disposition']).toContain('attachment')
    expect(file.headers['content-disposition']).toContain(source.name)
  })

  test('zárolt fájlfeladat semmit nem árul el: nincs fajta, file_task és URL', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const student = await verifiedStudent(apiClient, admin.client)

    const guest = await typedTask(apiClient, TYPED.docUpload.id)
    const unpaid = await typedTask(student.client, TYPED.docUpload.id)

    expect(guest.body.data).toMatchObject({ locked: true, locked_reason: 'login_required' })
    expect(unpaid.body.data).toMatchObject({ locked: true, locked_reason: 'subscription_required' })

    for (const { body } of [guest, unpaid]) {
      for (const absent of ['kind', 'description', 'file_task', 'sources', 'limits', 'starter_code']) {
        expect(body.data).not.toHaveProperty(absent)
      }
      expect(JSON.stringify(body)).not.toContain('signature=')
    }
  })

  test('prémium diák megkapja a fizetős fájlfeladat adatait', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const student = await premiumStudent(apiClient, admin.client)

    const { body } = await typedTask(student.client, TYPED.docUpload.id)

    expect(body.data).toMatchObject({ locked: false, kind: 'doc_upload' })
    expect(body.data.file_task).toMatchObject({ accepted_extensions: TYPED.docUpload.acceptedExtensions, sources: [], sample_image_url: null, exam_points: null })
    expect(JSON.stringify(body)).not.toContain('raw_points')
  })
})

test.describe('Admin: a feladat fajtája és fajtafüggő adatai', () => {
  test('fajta nélkül kódfeladat jön létre, ahogy a régi admin űrlap küldi', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)

    const exercise = await newExercise(admin.client, { allowed_languages: ['python'], starter_code: { python: 'print()' } })
    expect(exercise).toMatchObject({ kind: 'code', allowed_languages: ['python'], spec: null, comparison: null, is_published: false })

    const detail = await adminExercise(admin.client, exercise.id)
    expect(detail.body.data).toMatchObject({ kind: 'code', attachments: [], rubric_item_count: 0, test_case_count: 0 })

    // A régi űrlap PUT kérése (fajta, spec és összehasonlítás nélkül) változatlanul működik.
    const updated = await admin.client.put<{ data: AdminExercise }>(`admin/exercises/${exercise.id}`, {
      ...BASE,
      title: 'PW WP1: átnevezve',
      allowed_languages: ['python', 'csharp'],
      starter_code: {},
      is_published: false,
    })
    expect(updated.status).toBe(200)
    expect(updated.body.data).toMatchObject({ kind: 'code', title: 'PW WP1: átnevezve', allowed_languages: ['python', 'csharp'] })
  })

  test('csak SQL nyelvvel, fajta nélkül SQL feladat jön létre', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)

    const exercise = await newExercise(admin.client, { allowed_languages: ['sql'] })
    expect(exercise.kind).toBe('sql')

    // SQL feladatnak nem lehet más nyelve.
    const mixed = await updateExercise(admin.client, exercise.id, { allowed_languages: ['sql', 'python'] })
    expect(mixed.status).toBe(422)
    expect(mixed.errorBody.errors).toHaveProperty('allowed_languages')
  })

  test('a nyelvek a fajtához igazodnak: kódfeladatnál kötelező, más fajtánál tilos', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)

    const withLanguages = await createExercise(admin.client, { ...BASE, kind: 'sheet_upload', allowed_languages: ['python'], spec: UPLOAD_SPEC })
    expect(withLanguages.status).toBe(422)
    expect(withLanguages.errorBody.errors).toHaveProperty('allowed_languages')

    const withoutLanguages = await createExercise(admin.client, { ...BASE, kind: 'code', allowed_languages: [] })
    expect(withoutLanguages.status).toBe(422)
    expect(withoutLanguages.errorBody.errors).toHaveProperty('allowed_languages')

    const unknownKind = await createExercise(admin.client, { ...BASE, kind: 'video', allowed_languages: ['python'] })
    expect(unknownKind.status).toBe(422)
    expect(unknownKind.errorBody.errors).toHaveProperty('kind')
  })

  test('fájlfeladat spec-je: ismeretlen kulcs 422, a hiányzó mezők alapértéket kapnak', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)

    const unknownKey = await createExercise(admin.client, { ...BASE, kind: 'sheet_upload', spec: { ...UPLOAD_SPEC, accepted_extension: ['.ods'] } })
    expect(unknownKey.status).toBe(422)
    expect(unknownKey.errorBody.errors).toHaveProperty('spec')

    // A kiterjesztésnek a fajtához kell illenie: táblázatos feladat nem fogad dokumentumot.
    const wrongExtension = await createExercise(admin.client, { ...BASE, kind: 'sheet_upload', spec: { accepted_extensions: ['.docx'] } })
    expect(wrongExtension.status).toBe(422)
    expect(wrongExtension.errorBody.errors).toHaveProperty(['spec.accepted_extensions.0'])

    const exercise = await newTypedExercise(admin.client, 'sheet_upload', { spec: { ...UPLOAD_SPEC, raw_points: 70 } })
    expect(exercise.allowed_languages).toEqual([])
    expect(exercise.spec).toEqual({
      steps: [],
      deliverable: null,
      accepted_extensions: ['.xlsx'],
      software: [],
      exam_reference: null,
      exam_points: null,
      raw_points: 70,
    })

    // A null törli a spec-et.
    const cleared = await updateExercise(admin.client, exercise.id, { spec: null })
    expect(cleared.body.data.spec).toBeNull()
  })

  test('az ellenőrzések azonosítóját a szerver adja, és módosításkor megtartja', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)

    const exercise = await newTypedExercise(admin.client, 'web', {
      spec: { files: [WEB_FILE], checks: [TITLE_CHECK, { label: 'Van link', points: 2, type: 'link', href: 'index.html' }] },
    })
    expect(exercise.spec).toMatchObject({
      checks: [
        { id: 1, type: 'title', value: 'Teszt', hint: null },
        { id: 2, type: 'link', href: 'index.html' },
      ],
      exam_reference: null,
    })

    // Az 1-es törlődik, a 2-es marad, az új nem kapja meg a törölt 1-es azonosítóját.
    const updated = await updateExercise(admin.client, exercise.id, {
      spec: {
        files: [WEB_FILE],
        checks: [
          { id: 2, label: 'Van link', points: 2, type: 'link', href: 'index.html' },
          { label: 'Egy címsor', points: 1, type: 'element_count', selector: 'h1', count: 1 },
        ],
      },
    })
    expect(updated.status).toBe(200)
    expect(updated.body.data.spec).toMatchObject({ checks: [{ id: 2 }, { id: 3, type: 'element_count', selector: 'h1', count: 1 }] })
  })

  test('a spec belső szabályai: típusidegen mező, rossz nyelv, rácson kívüli cella, hiányzó bekezdés', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const errorsOf = async (kind: string, spec: Record<string, unknown>): Promise<Record<string, string[]>> => {
      const response = await createExercise(admin.client, { ...BASE, kind, spec })
      expect(response.status, JSON.stringify(spec)).toBe(422)
      return response.errorBody.errors
    }

    // Egy `title` ellenőrzés nem hordozhat `selector`-t (az az element_count mezője).
    expect(await errorsOf('web', { files: [WEB_FILE], checks: [{ ...TITLE_CHECK, selector: 'h1' }] })).toHaveProperty(['spec.checks.0'])
    expect(await errorsOf('web', { files: [WEB_FILE], checks: [{ label: 'Cím', points: 1, type: 'title' }] })).toHaveProperty(['spec.checks.0.value'])
    expect(await errorsOf('web', { files: [{ ...WEB_FILE, language: 'css' }] })).toHaveProperty(['spec.files.0.language'])
    expect(await errorsOf('web', { files: [{ name: 'stilus.css', language: 'css', content: '' }] })).toHaveProperty(['spec.files'])

    expect(await errorsOf('sheet_browser', { columns: 2, rows: 2, cells: { C1: 'kint' } })).toHaveProperty(['spec.cells'])
    expect(
      await errorsOf('sheet_browser', { columns: 2, rows: 2, checks: [{ label: 'Képlet', type: 'has_formula', cell: 'B3' }] })
    ).toHaveProperty(['spec.checks.0.cell'])

    expect(
      await errorsOf('doc_browser', { paragraphs: ['Egy'], checks: [{ label: 'Félkövér', paragraph: 1, type: 'bold' }] })
    ).toHaveProperty(['spec.checks.0.paragraph'])
    expect(
      await errorsOf('doc_browser', { paragraphs: ['Egy'], checks: [{ label: 'Betűméret', paragraph: 0, type: 'font_size', value: 'nagy' }] })
    ).toHaveProperty(['spec.checks.0.value'])
  })

  test('az összehasonlítás módja csak kódfeladatnál állítható', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)

    const exercise = await newExercise(admin.client, { comparison: { mode: 'numeric', abs_tol: 0.01 } })
    expect(exercise.comparison).toEqual({
      mode: 'numeric',
      case_insensitive: false,
      ignore_accents: false,
      ignore_blank_lines: false,
      abs_tol: 0.01,
      rel_tol: null,
    })

    const unknownMode = await updateExercise(admin.client, exercise.id, { comparison: { mode: 'fuzzy' } })
    expect(unknownMode.status).toBe(422)
    expect(unknownMode.errorBody.errors).toHaveProperty(['comparison.mode'])

    const onWeb = await createExercise(admin.client, { ...BASE, kind: 'web', spec: { files: [WEB_FILE] }, comparison: { mode: 'tokens' } })
    expect(onWeb.status).toBe(422)
    expect(onWeb.errorBody.errors).toHaveProperty('comparison')
  })
})

test.describe('Admin: publikálás fajtánként', () => {
  test('fájlfeladat értékelőlap nélkül nem publikálható', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)

    const atCreation = await createExercise(admin.client, { ...BASE, kind: 'sheet_upload', spec: UPLOAD_SPEC, is_published: true })
    expect(atCreation.status).toBe(422)
    expect(atCreation.errorBody.errors).toHaveProperty('is_published')

    const exercise = await newTypedExercise(admin.client, 'sheet_upload', { spec: UPLOAD_SPEC })
    const published = await updateExercise(admin.client, exercise.id, { is_published: true })
    expect(published.status).toBe(422)
    expect(published.errorBody.errors).toHaveProperty('is_published')

    // Spec nélkül sem: a diák nem tudná, mit adjon be.
    const withoutSpec = await newTypedExercise(admin.client, 'doc_upload')
    const publishedWithoutSpec = await updateExercise(admin.client, withoutSpec.id, { is_published: true })
    expect(publishedWithoutSpec.status).toBe(422)
    expect(publishedWithoutSpec.errorBody.errors).toHaveProperty('is_published')
  })

  test('weboldal-feladat ellenőrzés nélkül nem publikálható, ellenőrzéssel igen', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newTypedExercise(admin.client, 'web', { spec: { files: [WEB_FILE] } })

    const withoutChecks = await updateExercise(admin.client, exercise.id, { is_published: true })
    expect(withoutChecks.status).toBe(422)
    expect(withoutChecks.errorBody.errors).toHaveProperty('is_published')

    const withChecks = await updateExercise(admin.client, exercise.id, { is_published: true, spec: { files: [WEB_FILE], checks: [TITLE_CHECK] } })
    expect(withChecks.status).toBe(200)
    expect(withChecks.body.data.is_published).toBe(true)

    // A publikált feladat a diáknak a szerver által számozott ellenőrzésekkel jelenik meg.
    const forStudent = await typedTask(apiClient, exercise.id)
    expect(forStudent.body.data).toMatchObject({ kind: 'web', web_task: { checks: [{ id: 1, ...TITLE_CHECK }] } })

    // Publikálva az ellenőrzések már nem törölhetők ki alóla.
    const emptied = await updateExercise(admin.client, exercise.id, { spec: { files: [WEB_FILE], checks: [] } })
    expect(emptied.status).toBe(422)
    expect(emptied.errorBody.errors).toHaveProperty('is_published')
  })

  test('kódfeladat teszteset nélkül továbbra sem publikálható', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)

    const response = await createExercise(admin.client, { ...BASE, allowed_languages: ['python'], is_published: true })

    expect(response.status).toBe(422)
    expect(response.errorBody.errors).toHaveProperty('is_hidden')
  })
})

test.describe('Admin: fajtaváltás és törlés', () => {
  test('beadás után a feladat fajtája nem változtatható, és a feladat nem törölhető', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const id = TYPED.subtasks.id

    const submitted = await apiClient.submit({ task_id: id, language: TYPED.subtasks.language, source_code: ECHO_PROGRAM })
    expect(submitted.ok).toBe(true)

    const changed = await updateExercise(admin.client, id, { kind: 'web', spec: { files: [WEB_FILE] } })
    expect(changed.status).toBe(422)
    expect(changed.errorBody.errors).toHaveProperty('kind')

    expect((await deleteExercise(admin.client, id)).status).toBe(409)
    expect((await adminExercise(admin.client, id)).body.data.kind).toBe('code')
  })

  test('vizsgarészben használt feladat nem törölhető, és a fajtája sem változtatható', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const id = TYPED.sheetUpload.id

    expect((await deleteExercise(admin.client, id)).status).toBe(409)

    const changed = await updateExercise(admin.client, id, { kind: 'doc_upload', spec: { accepted_extensions: ['.docx'] } })
    expect(changed.status).toBe(422)
    expect(changed.errorBody.errors).toHaveProperty('kind')

    expect((await typedTask(apiClient, id)).body.data.kind).toBe('sheet_upload')
  })

  test('érintetlen feladat fajtája váltható: a régi fajta adatai nem maradnak meg', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newExercise(admin.client, {
      starter_code: { python: 'print()' },
      comparison: { mode: 'tokens' },
      spec: { subtasks: [{ number: 1, label: 'Első', points: 2 }] },
    })
    expect(exercise.spec).toEqual({ subtasks: [{ number: 1, label: 'Első', points: 2 }] })

    const changed = await updateExercise(admin.client, exercise.id, { kind: 'doc_browser' })

    expect(changed.status).toBe(200)
    expect(changed.body.data).toMatchObject({ kind: 'doc_browser', allowed_languages: [], starter_code: {}, spec: null, comparison: null })

    // Vissza kódfeladatra csak nyelvvel lehet.
    const backWithoutLanguages = await updateExercise(admin.client, exercise.id, { kind: 'code' })
    expect(backWithoutLanguages.status).toBe(422)
    expect(backWithoutLanguages.errorBody.errors).toHaveProperty('allowed_languages')
  })

  test('csatolt fájl mellett a fajta nem váltható', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newExercise(admin.client)
    const uploaded = await uploadAttachment(admin.client, exercise.id, uploadOf('adatok.txt', 'egy sor\n'), { role: 'source' })
    expect(uploaded.status).toBe(201)

    const blocked = await updateExercise(admin.client, exercise.id, { kind: 'sheet_browser' })
    expect(blocked.status).toBe(422)
    expect(blocked.errorBody.errors).toHaveProperty('kind')

    expect((await deleteAttachment(admin.client, uploaded.body.data.id)).status).toBe(204)
    expect((await updateExercise(admin.client, exercise.id, { kind: 'sheet_browser' })).status).toBe(200)
  })
})

test.describe('Admin: csatolmányok', () => {
  test('csak admin érheti el: vendég 401, diák 403', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const student = await verifiedStudent(apiClient, admin.client)
    const id = TYPED.subtasks.id
    const file = uploadOf('uj.txt', 'minta\n')

    expect((await listAttachments(apiClient, id)).status).toBe(401)
    expect((await uploadAttachment(apiClient, id, file, { role: 'source' })).status).toBe(401)
    expect((await deleteAttachment(apiClient, TYPED.subtasks.source.attachmentId)).status).toBe(401)

    expect((await listAttachments(student.client, id)).status).toBe(403)
    expect((await uploadAttachment(student.client, id, file, { role: 'source' })).status).toBe(403)
    expect((await deleteAttachment(student.client, TYPED.subtasks.source.attachmentId)).status).toBe(403)

    // A fixture forrásfájl érintetlen maradt.
    const list = await listAttachments(admin.client, id)
    expect(list.body.data.map((attachment) => attachment.name)).toEqual([TYPED.subtasks.source.name])
  })

  test('forrásfájl: a név szabályai, azonos névvel csere, a hatodik fájl 422', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newExercise(admin.client)
    const upload = (name: string, contents: string, publicName?: string) =>
      uploadAttachment(admin.client, exercise.id, uploadOf(name, contents), { role: 'source', ...(publicName === undefined ? {} : { name: publicName }) })

    const invalidName = await upload('adatok.txt', 'egy sor\n', 'adat fájl.txt')
    expect(invalidName.status).toBe(422)
    expect(invalidName.errorBody.errors).toHaveProperty('name')

    // A kódfuttató saját fájlneve nem írható felül.
    const reserved = await upload('script.py', 'print()\n')
    expect(reserved.status).toBe(422)
    expect(reserved.errorBody.errors).toHaveProperty('name')

    const first = await upload('adatok.txt', 'elso\n')
    expect(first.status).toBe(201)
    expect(first.body.data).toMatchObject({ role: 'source', name: 'adatok.txt', size: 5, test_case_id: null })

    const replaced = await upload('masik.txt', 'masodik\n', 'adatok.txt')
    expect(replaced.status).toBe(201)
    expect(replaced.body.data.id).toBe(first.body.data.id)
    expect((await download(apiClient, replaced.body.data.url)).body.toString('utf8')).toBe('masodik\n')

    for (const name of ['b.txt', 'c.txt', 'd.txt', 'e.txt']) {
      expect((await upload(name, 'minta\n')).status, name).toBe(201)
    }

    const sixth = await upload('f.txt', 'minta\n')
    expect(sixth.status).toBe(422)
    expect(sixth.errorBody.errors).toHaveProperty('file')

    const list = await listAttachments(admin.client, exercise.id)
    expect(list.body.data.map((attachment) => attachment.name)).toEqual(['adatok.txt', 'b.txt', 'c.txt', 'd.txt', 'e.txt'])
    expect((await adminExercise(admin.client, exercise.id)).body.data.attachments).toHaveLength(5)
  })

  test('bemeneti fájl csak a feladat saját tesztesetéhez tölthető fel', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newExercise(admin.client)
    const testCase = await createTestCase(admin.client, exercise.id, { stdin: 'egy sor\n', expected_stdout: 'egy sor\n', is_hidden: true })
    const foreign = (await testCases(admin.client, TYPED.subtasks.id)).body.data[0]?.id ?? 0
    const file = uploadOf('adatok.txt', 'rejtett\n')

    const withoutTestCase = await uploadAttachment(admin.client, exercise.id, file, { role: 'input' })
    expect(withoutTestCase.status).toBe(422)
    expect(withoutTestCase.errorBody.errors).toHaveProperty('test_case_id')

    const foreignTestCase = await uploadAttachment(admin.client, exercise.id, file, { role: 'input', test_case_id: foreign })
    expect(foreignTestCase.status).toBe(422)
    expect(foreignTestCase.errorBody.errors).toHaveProperty('test_case_id')

    // Forrásfájlhoz nem adható meg teszteset.
    const sourceWithTestCase = await uploadAttachment(admin.client, exercise.id, file, { role: 'source', test_case_id: testCase.body.data.id })
    expect(sourceWithTestCase.status).toBe(422)
    expect(sourceWithTestCase.errorBody.errors).toHaveProperty('test_case_id')

    const input = await uploadAttachment(admin.client, exercise.id, file, { role: 'input', test_case_id: testCase.body.data.id })
    expect(input.status).toBe(201)
    expect(input.body.data).toMatchObject({ role: 'input', name: 'adatok.txt', test_case_id: testCase.body.data.id })
  })

  test('a szerep a fajtához kötött: mintamegoldás csak fájlfeladathoz, forrás-zip feladathoz soha', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const code = await newExercise(admin.client)
    const sheet = await newTypedExercise(admin.client, 'sheet_upload', { spec: UPLOAD_SPEC })

    const solutionOnCode = await uploadAttachment(admin.client, code.id, fixtureFile(FIXTURE_FILES.sheetOk), { role: 'sample_solution' })
    expect(solutionOnCode.status).toBe(422)
    expect(solutionOnCode.errorBody.errors).toHaveProperty('role')

    const zip = await uploadAttachment(admin.client, sheet.id, fixtureFile(FIXTURE_FILES.sourceZip), { role: 'source_zip' })
    expect(zip.status).toBe(422)
    expect(zip.errorBody.errors).toHaveProperty('role')

    const withoutFile = await admin.client.postMultipart(`admin/exercises/${sheet.id}/attachments`, { role: 'source' })
    expect(withoutFile.status).toBe(422)
    expect(withoutFile.errorBody.errors).toHaveProperty('file')

    // A mintakép egyetlen fájl: az új feltöltés a régit cseréli, a nevétől függetlenül.
    const image = await uploadAttachment(admin.client, sheet.id, fixtureFile(FIXTURE_FILES.sampleImage), { role: 'sample_image' })
    const again = await uploadAttachment(admin.client, sheet.id, fixtureFile(FIXTURE_FILES.sampleImage, 'masik-minta.png'), { role: 'sample_image' })
    expect(image.status).toBe(201)
    expect(again.body.data).toMatchObject({ id: image.body.data.id, name: 'masik-minta.png' })
  })

  test('a diáknak tiltott szerepek érvényes diák-aláírással is 404-et adnak', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const code = await newExercise(admin.client)
    const sheet = await newTypedExercise(admin.client, 'sheet_upload', { spec: UPLOAD_SPEC })
    const testCase = await createTestCase(admin.client, code.id, { stdin: 'egy sor\n', expected_stdout: 'egy sor\n', is_hidden: true })

    const source = await uploadAttachment(admin.client, code.id, uploadOf('adatok.txt', 'kozos\n'), { role: 'source' })
    const input = await uploadAttachment(admin.client, code.id, uploadOf('adatok.txt', 'rejtett\n'), { role: 'input', test_case_id: testCase.body.data.id })
    const solution = await uploadAttachment(admin.client, sheet.id, fixtureFile(FIXTURE_FILES.sheetOk), { role: 'sample_solution' })
    expect([source.status, input.status, solution.status]).toEqual([201, 201, 201])

    // Az admin URL-je mindhárom szerepet letölti.
    expect((await download(apiClient, input.body.data.url)).body.toString('utf8')).toBe('rejtett\n')
    expect((await download(apiClient, solution.body.data.url)).status).toBe(200)

    // A saját aláírásunk helyes (a forrásfájlt letölti), tehát a 404 a szerepnek szól, nem az aláírásnak.
    expect((await download(apiClient, studentDownloadUrl(source.body.data.id))).body.toString('utf8')).toBe('kozos\n')
    expect((await download(apiClient, studentDownloadUrl(input.body.data.id))).status).toBe(404)
    expect((await download(apiClient, studentDownloadUrl(solution.body.data.id))).status).toBe(404)

    // Az admin jelző az aláírás része: utólag nem fűzhető hozzá egy diák-URL-hez.
    expect((await download(apiClient, `${studentDownloadUrl(input.body.data.id)}&admin=1`)).status).toBe(403)
  })

  test('a rejtett teszteset bemeneti fájlja nem jelenik meg a diák feladatnézetében', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const id = TYPED.subtasks.id
    const testCase = (await testCases(admin.client, id)).body.data[0]?.id ?? 0

    const input = await uploadAttachment(admin.client, id, uploadOf('titkos.txt', 'rejtett bemenet\n'), { role: 'input', test_case_id: testCase })
    expect(input.status).toBe(201)

    try {
      const forStudent = await typedTask(apiClient, id)
      expect(forStudent.body.data.sources?.map((source) => source.name)).toEqual([TYPED.subtasks.source.name])
      expect(JSON.stringify(forStudent.body)).not.toContain('titkos.txt')
      expect(JSON.stringify(forStudent.body)).not.toContain(`/attachments/${input.body.data.id}/`)

      // Az admin részletes nézete mindkettőt mutatja.
      const forAdmin = await adminExercise(admin.client, id)
      expect(forAdmin.body.data.attachments?.map((attachment) => attachment.role).sort()).toEqual(['input', 'source'])
    } finally {
      // A fixture feladat a többi specnek változatlan maradjon.
      await deleteAttachment(admin.client, input.body.data.id)
    }
  })

  test('törlés után a fájl nem tölthető le', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newExercise(admin.client)
    const uploaded = await uploadAttachment(admin.client, exercise.id, uploadOf('adatok.txt', 'egy sor\n'), { role: 'source' })
    expect((await download(apiClient, uploaded.body.data.url)).status).toBe(200)

    expect((await deleteAttachment(admin.client, uploaded.body.data.id)).status).toBe(204)

    expect((await download(apiClient, uploaded.body.data.url)).status).toBe(404)
    expect((await listAttachments(admin.client, exercise.id)).body.data).toEqual([])
    expect((await deleteAttachment(admin.client, uploaded.body.data.id)).status).toBe(404)
  })

  test('a feladat törlése a csatolt fájljait is törli', { tag: '@smoke' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newExercise(admin.client)
    const testCase = await createTestCase(admin.client, exercise.id, { stdin: 'egy sor\n', expected_stdout: 'egy sor\n', is_hidden: false })
    const source = await uploadAttachment(admin.client, exercise.id, uploadOf('adatok.txt', 'egy sor\n'), { role: 'source' })
    const input = await uploadAttachment(admin.client, exercise.id, uploadOf('adatok.txt', 'ket sor\n'), { role: 'input', test_case_id: testCase.body.data.id })
    expect([source.status, input.status]).toEqual([201, 201])

    expect((await deleteExercise(admin.client, exercise.id)).status).toBe(204)

    expect((await adminExercise(admin.client, exercise.id)).status).toBe(404)
    expect((await download(apiClient, source.body.data.url)).status).toBe(404)
    expect((await download(apiClient, input.body.data.url)).status).toBe(404)
    expect((await deleteAttachment(admin.client, source.body.data.id)).status).toBe(404)
  })

  test('a teszteset törlése a saját bemeneti fájlját is törli, a közös forrásfájlt nem', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = await adminAccount(apiClient)
    const exercise = await newExercise(admin.client)
    const testCase = await createTestCase(admin.client, exercise.id, { stdin: 'egy sor\n', expected_stdout: 'egy sor\n', is_hidden: true })
    const source = await uploadAttachment(admin.client, exercise.id, uploadOf('adatok.txt', 'egy sor\n'), { role: 'source' })
    const input = await uploadAttachment(admin.client, exercise.id, uploadOf('adatok.txt', 'ket sor\n'), { role: 'input', test_case_id: testCase.body.data.id })
    expect([source.status, input.status]).toEqual([201, 201])

    expect((await deleteTestCase(admin.client, testCase.body.data.id)).status).toBe(204)

    expect((await download(apiClient, input.body.data.url)).status).toBe(404)
    expect((await download(apiClient, source.body.data.url)).status).toBe(200)
    expect((await listAttachments(admin.client, exercise.id)).body.data.map((attachment) => attachment.id)).toEqual([source.body.data.id])
  })
})
