/**
 * REL-5: ahol az SQLite (helyi/`api` projekt) es a MySQL (eles, `backend-mysql` CI job) eltero modon viselkedik.
 * Ugyanazok az esetek mindket motoron zoldek kell legyenek; ahol a ket motor tenylegesen mast ad, azt a teszt kimondja.
 */
import { adminAccount } from '../../src/api/areas/accounts'
import { createCodeExercise, deleteCodeExercise } from '../../src/api/areas/execution'
import { deleteAccount } from '../../src/api/areas/progress'
import { DEFAULT_PASSWORD, registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'
import { randomUUID } from 'node:crypto'

test.describe('SQLite es MySQL eltereseinek celzott esetei', () => {
  test('az e-mail kis- es nagybetu szerint nem kulonbozteti meg a fiokokat', { tag: '@regression' }, async ({ apiClient }) => {
    const local = `pw-${randomUUID()}`
    const mixed = registration({ email: `${local.replace('pw', 'PW')}@Example.TEST` })
    const lower = registration({ email: `${local}@example.test` })

    const first = await apiClient.register(mixed)
    expect(first.status).toBe(201)
    // A tarolt cim kisbetus.
    expect(first.body.data.email).toBe(lower.email)

    // Kisbetus valtozat: ugyanaz a fiok, ezert nem regisztralhato ujra.
    const duplicate = await apiClient.register(lower)
    expect(duplicate.status).toBe(422)
    expect(duplicate.errorBody.errors).toHaveProperty('email')

    // Es forditva is: nagybetus valtozat egy mar kisbetusen regisztralt cimmel.
    const again = await apiClient.register({ ...mixed, email: mixed.email.toUpperCase() })
    expect(again.status).toBe(422)

    // A bejelentkezes is mindket irasmoddal ugyanazt a fiokot adja.
    for (const email of [mixed.email, lower.email]) {
      const login = await apiClient.login({ email, password: DEFAULT_PASSWORD })
      expect(login.status, email).toBe(200)
      expect(login.body.data.user.email).toBe(lower.email)
    }
  })

  test('a torolt fiok cime ujraregisztralhato', { tag: '@regression' }, async ({ apiClient, request }) => {
    const payload = registration()
    const { token, user } = await apiClient.signUp(payload)

    expect(await deleteAccount(request, token, payload.password)).toBe(204)

    // A torolt fiok a soft delete ellenere nem foglalja a cimet.
    const again = await apiClient.register(payload)
    expect(again.status).toBe(201)
    expect(again.body.data.id).not.toBe(user.id)

    const login = await apiClient.login({ email: payload.email, password: payload.password })
    expect(login.status).toBe(200)
    expect(login.body.data.user.id).toBe(again.body.data.id)
  })

  test('ekezetes slug: a hosszu, ekezetes cimbol ASCII slug lesz, az ekezetes slug nem fogadhato el es nem keresheto', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const suffix = randomUUID().slice(0, 8)
    const title = 'Árvíztűrő tükörfúrógép és más ékezetes ő/ű betűk'

    // Ekezetes slug a validacion (alpha_dash:ascii) elbukik, nem 500-as hiba.
    const rejected = await admin.post('admin/tracks', { slug: `pw-árvíz-${suffix}`, title, is_published: true })
    expect(rejected.status).toBe(422)
    expect(rejected.errorBody.errors).toHaveProperty('slug')

    // Az ekezetes cim ugyanakkor szo szerint visszajon (utf8mb4 korut).
    const slug = `pw-arviz-${suffix}`
    const created = await admin.post<{ data: { id: number; slug: string; title: string } }>('admin/tracks', { slug, title, is_published: true })
    expect(created.status).toBe(201)

    try {
      const found = await apiClient.get<{ data: { title: string } }>(`tracks/${slug}`)
      expect(found.status).toBe(200)
      expect(found.body.data.title).toBe(title)

      // Ekezetes (szazalekkodolt) slug keresese: 404, soha 5xx.
      const accented = await apiClient.get(`tracks/${encodeURIComponent(`pw-árvíz-${suffix}`)}`)
      expect(accented.status).toBe(404)

      // Eltero nagybetu: MySQL-en (case-insensitive collation) megtalalja, SQLite-on nem. Mindketto elfogadhato,
      // de 5xx nem lehet; a kulonbseg ismert.
      const upper = await apiClient.get(`tracks/${slug.toUpperCase()}`)
      expect([200, 404]).toContain(upper.status)
    } finally {
      expect((await admin.delete(`admin/tracks/${String(created.body.data.id)}`)).status).toBe(204)
    }
  })

  test('hosszu, tobbbajtos szoveg (tananyag es feladatleiras) szo szerint visszajon', { tag: '@regression' }, async ({ apiClient }) => {
    const admin = (await adminAccount(apiClient)).client
    const fixture = await createCodeExercise(admin, [{ stdin: '1\n', expected_stdout: '1\n' }])

    // ~90 000 karakter, ekezetekkel, emojival es sortoressel: tobb mint a MySQL TEXT 65 535 bajtos hatara.
    const unit = 'Árvíztűrő tükörfúrógép — ŐŰ őű 𝒳 😀\r\n\ttab "idézőjel" \\ perjel\n'
    // A vegen nincs szokoz/sortores: a kereskozi TrimStrings azt levagna, es az nem hiba.
    const text = `${unit.repeat(Math.floor(90_000 / unit.length))}vege`
    expect(Buffer.byteLength(text)).toBeGreaterThan(65_535)

    try {
      const lesson = await admin.patch(`admin/lessons/${String(fixture.lessonId)}`, { content: text })
      expect(lesson.status).toBe(200)
      const exercise = await admin.patch(`admin/exercises/${String(fixture.exerciseId)}`, { description: text })
      expect(exercise.status).toBe(200)

      const lessonBack = await admin.get<{ data: { content: string } }>(`admin/lessons/${String(fixture.lessonId)}`)
      expect(lessonBack.body.data.content).toBe(text)
      const exerciseBack = await admin.get<{ data: { description: string } }>(`admin/exercises/${String(fixture.exerciseId)}`)
      expect(exerciseBack.body.data.description).toBe(text)

      // A diak oldali (nyilvanos) nezet is ugyanazt adja.
      const task = await apiClient.get<{ data: { description: string } }>(`tasks/${String(fixture.exerciseId)}`)
      expect(task.body.data.description).toBe(text)
    } finally {
      await deleteCodeExercise(admin, fixture)
    }
  })
})
