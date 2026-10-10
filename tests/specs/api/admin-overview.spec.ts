import { randomUUID } from 'node:crypto'
import type { ApiClient } from '../../src/api/ApiClient'
import { adminAccount } from '../../src/api/areas/accounts'
import {
  adminInvoiceAttentionTotal,
  adminOverview,
  adminTracks,
  adminUserTotal,
  createDraftTrack,
  deleteTrack,
  updateTrack,
} from '../../src/api/areas/adminOverview'
import type { AdminOverview } from '../../src/api/types'
import { registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'

/** Ennyi naplózott művelet látszik legfeljebb. */
const RECENT_ACTION_LIMIT = 10
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/

/**
 * A fixture adatbázis (ApiTestSeeder) állapota: egy nem publikus vizsga van
 * (SEEDED.exams.unpublished), és minden értékelőlap teljes. Ez a spec fájl fut
 * elsőként (névsorban az első), ezért más teszt még nem hozott létre vizsgát
 * vagy értékelőlap nélküli feladatot.
 */
const SEEDED_CATALOG = { draftExams: 1, incompleteRubrics: 0 }

/** Az áttekintő számai; a teszt-backend nem gyorsítótáraz, így mindig frissek. */
async function overviewOf(admin: ApiClient): Promise<AdminOverview> {
  const overview = await adminOverview(admin)
  expect(overview.status).toBe(200)

  return overview.body.data
}

function uniqueSlug(): string {
  return `pw-attekinto-${randomUUID()}`
}

test.describe('Admin áttekintő (GET /admin/overview)', () => {
  test.describe('jogosultság', () => {
    test('bejelentkezés nélkül 401', { tag: '@regression' }, async ({ apiClient }) => {
      expect((await adminOverview(apiClient)).status).toBe(401)
    })

    test('diák 403-at kap', { tag: '@smoke' }, async ({ apiClient }) => {
      const student = await apiClient.signUp(registration())

      expect((await adminOverview(student.client)).status).toBe(403)
    })
  })

  test('az admin pontosan a szerződés szerinti kulcsokat kapja, nemnegatív egész számokkal', { tag: '@smoke' }, async ({ apiClient }) => {
    const { client } = await adminAccount(apiClient)

    const overview = await adminOverview(client)

    expect(overview.status).toBe(200)
    expect(overview.body).toStrictEqual({
      data: {
        users: { total: expect.any(Number), unverified: expect.any(Number) },
        subscribers: { active: expect.any(Number), past_due: expect.any(Number) },
        invoices: { attention: expect.any(Number) },
        catalog: {
          tracks: expect.any(Number),
          draft_tracks: expect.any(Number),
          incomplete_rubrics: expect.any(Number),
          draft_exams: expect.any(Number),
        },
        recent_actions: expect.any(Array),
      },
    })

    const { users, subscribers, invoices, catalog } = overview.body.data
    const figures = [...Object.values(users), ...Object.values(subscribers), ...Object.values(invoices), ...Object.values(catalog)]
    expect(figures.filter((figure) => !Number.isInteger(figure) || figure < 0)).toEqual([])
  })

  test('a számok megegyeznek a listákéval, amelyekből az oldal eddig számolt', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await adminAccount(apiClient)
    // Legyen megerősítetlen fiók is, hogy a szűrt szám ne nulla legyen.
    await apiClient.signUp(registration())

    const overview = await overviewOf(client)
    const tracks = await adminTracks(client)

    expect(overview.users).toEqual({
      total: await adminUserTotal(client),
      unverified: await adminUserTotal(client, { verified: '0' }),
    })
    expect(overview.users.unverified).toBeGreaterThan(0)
    expect(overview.subscribers).toEqual({
      active: await adminUserTotal(client, { subscription: 'active' }),
      past_due: await adminUserTotal(client, { subscription: 'past_due' }),
    })
    expect(overview.invoices.attention).toBe(await adminInvoiceAttentionTotal(client))
    expect(overview.catalog.tracks).toBe(tracks.length)
    expect(overview.catalog.draft_tracks).toBe(tracks.filter((track) => !track.is_published).length)
  })

  test('a fixture adatokon minden értékelőlap teljes, és egy vizsga piszkozat', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await adminAccount(apiClient)

    const { catalog } = await overviewOf(client)

    expect(catalog.incomplete_rubrics).toBe(SEEDED_CATALOG.incompleteRubrics)
    expect(catalog.draft_exams).toBe(SEEDED_CATALOG.draftExams)
  })

  test.describe('felhasználók', () => {
    test('a regisztráció mindkét számot növeli, a kézi megerősítés csak a megerősítetleneket csökkenti', { tag: '@smoke' }, async ({ apiClient }) => {
      const { client } = await adminAccount(apiClient)
      const before = (await overviewOf(client)).users

      const registered = await apiClient.signUp(registration())

      expect((await overviewOf(client)).users).toEqual({ total: before.total + 1, unverified: before.unverified + 1 })

      expect((await client.adminVerifyEmail(registered.user.id, 'Playwright API teszt')).ok).toBe(true)

      expect((await overviewOf(client)).users).toEqual({ total: before.total + 1, unverified: before.unverified })
    })

    test('a törölt fiók kikerül a számokból', { tag: '@regression' }, async ({ apiClient }) => {
      const { client } = await adminAccount(apiClient)
      const registered = await apiClient.signUp(registration())
      const before = (await overviewOf(client)).users

      expect((await client.adminDeleteUser(registered.user.id)).status).toBe(204)

      expect((await overviewOf(client)).users).toEqual({ total: before.total - 1, unverified: before.unverified - 1 })
    })
  })

  test.describe('képzési ágak és legutóbbi műveletek', () => {
    test('az új piszkozat ág beleszámít, a létrehozása pedig a műveletek élére kerül', { tag: '@smoke' }, async ({ apiClient }) => {
      const admin = await adminAccount(apiClient)
      const before = (await overviewOf(admin.client)).catalog
      const track = await createDraftTrack(admin.client, uniqueSlug())

      try {
        const created = await overviewOf(admin.client)

        expect(created.catalog).toEqual({ ...before, tracks: before.tracks + 1, draft_tracks: before.draft_tracks + 1 })
        expect(created.recent_actions[0]).toStrictEqual({
          id: expect.any(Number),
          action: 'catalog.created',
          label: 'Tananyag létrehozva',
          actor: { id: admin.user.id, name: admin.user.name },
          subject_type: 'track',
          subject_id: track.id,
          created_at: expect.stringMatching(ISO_8601),
        })

        // Publikálva már nem piszkozat, és a módosítás is naplózott művelet.
        expect((await updateTrack(admin.client, track.id, { is_published: true })).status).toBe(200)
        const published = await overviewOf(admin.client)

        expect(published.catalog).toEqual({ ...before, tracks: before.tracks + 1 })
        expect(published.recent_actions[0]).toMatchObject({ action: 'catalog.updated', label: 'Tananyag módosítva', subject_type: 'track', subject_id: track.id })
        expect(published.recent_actions[1]?.id).toBe(created.recent_actions[0]?.id)
      } finally {
        // A katalógust más spec fájlok is olvassák: az ág nem maradhat meg.
        await deleteTrack(admin.client, track.id)
      }

      const removed = await overviewOf(admin.client)
      expect(removed.catalog).toEqual(before)
      expect(removed.recent_actions[0]).toMatchObject({ action: 'catalog.deleted', label: 'Tananyag törölve', subject_type: 'track', subject_id: track.id })
    })

    test('legfeljebb tíz művelet látszik, a legfrissebb elöl', { tag: '@regression' }, async ({ apiClient }) => {
      const admin = await adminAccount(apiClient)
      const track = await createDraftTrack(admin.client, uniqueSlug())

      try {
        // Eggyel több módosítás, mint amennyi kifér: a létrehozás és az első módosítás kiszorul.
        for (let round = 1; round <= RECENT_ACTION_LIMIT + 1; round++) {
          const updated = await updateTrack(admin.client, track.id, { title: `PW áttekintő ${String(round)}. módosítás` })
          expect(updated.status).toBe(200)
        }

        const { recent_actions: actions } = await overviewOf(admin.client)
        const ids = actions.map((action) => action.id)

        expect(actions).toHaveLength(RECENT_ACTION_LIMIT)
        expect(ids).toEqual([...ids].sort((a, b) => b - a))
        expect(new Set(ids).size).toBe(RECENT_ACTION_LIMIT)
        expect(actions.map((action) => `${action.action}:${String(action.subject_id)}`)).toEqual(
          Array.from({ length: RECENT_ACTION_LIMIT }, () => `catalog.updated:${String(track.id)}`)
        )
      } finally {
        await deleteTrack(admin.client, track.id)
      }
    })
  })
})
