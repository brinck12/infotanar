import type { ApiClient } from '../../src/api/ApiClient'
import type { Outbox } from '../../src/api/Outbox'
import { adminAccount, verifiedStudent, type Account } from '../../src/api/areas/accounts'
import { accountExport, deleteAccount } from '../../src/api/areas/progress'
import {
  disableWeeklySummary,
  enableWeeklySummary,
  setWeeklySummary,
  unsubscribe,
  unsubscribeLinkIn,
  weeklyRhythm,
} from '../../src/api/areas/rhythm'
import { DEFAULT_PASSWORD, ECHO_PROGRAM, registration, SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'
import { forceWeeklySummary, plantLessonCompletion, runWeeklySummaries, weeklySummaryState } from '../../src/support/artisan'

/**
 * Heti összefoglaló e-mail (opt-in): a be- és kikapcsolás (PUT /account/notifications), a vasárnap esti küldés
 * (SendWeeklySummaries, itt szinkron futtatva) és a leiratkozás a levél linkjéről. A hangnem kedves: csak az
 * szerepel a levélben, ami a héten történt; aki nem tanult, nem kap levelet.
 */

const SUMMARY_SUBJECT = 'Ezen a héten ennyit haladtál'
const FORBIDDEN_WORDS = ['lemaradt', 'hiányzol', 'megszakad', 'elveszt', 'sajnos', 'széria', 'nem tanultál', 'nógat']

async function verified(apiClient: ApiClient): Promise<Account> {
  const admin = await adminAccount(apiClient)
  return verifiedStudent(apiClient, admin.client)
}

/** Megerősített, feliratkozott diák; a levelekhez még tevékenység is kell (`plantLessonCompletion`). */
async function subscribed(apiClient: ApiClient): Promise<Account> {
  const account = await verified(apiClient)
  expect((await enableWeeklySummary(account.client)).status).toBe(200)
  return account
}

/** Hany heti osszefoglalo ment a cimre (a regisztracios megerosito level nem szamit bele). */
async function summaryMails(outbox: Outbox, address: string): Promise<number> {
  return (await outbox.all()).filter((mail) => mail.to.includes(address) && mail.subject === SUMMARY_SUBJECT).length
}

async function summaryConsents(client: ApiClient): Promise<unknown[]> {
  const exported = await accountExport(client)
  return (exported.body.consents as { type: string }[]).filter((consent) => consent.type === 'weekly_summary')
}

test.describe('Heti összefoglaló: be- és kikapcsolás (PUT /account/notifications)', () => {
  test('bejelentkezés nélkül 401', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await setWeeklySummary(apiClient, { enabled: true, privacy_version: '0.1' })

    expect(result.status).toBe(401)
  })

  test('alapból kikapcsolt, és a /me meg az export is ezt mutatja', { tag: '@smoke' }, async ({ apiClient }) => {
    const account = await verified(apiClient)

    expect((await account.client.me()).body.data.weekly_summary).toBe(false)
    expect((await accountExport(account.client)).body.profile).toMatchObject({ weekly_summary: false })
  })

  test('bekapcsolás: a felhasználó mezője igaz, és pontosan egy hozzájárulás rögzül; ismétlésre nem lesz több', { tag: '@smoke' }, async ({ apiClient }) => {
    const account = await verified(apiClient)

    const on = await enableWeeklySummary(account.client)
    const again = await enableWeeklySummary(account.client)

    expect(on.status).toBe(200)
    expect(on.body.data.weekly_summary).toBe(true)
    expect(again.status).toBe(200)
    expect((await account.client.me()).body.data.weekly_summary).toBe(true)
    expect(await summaryConsents(account.client)).toHaveLength(1)
  })

  test('kikapcsolás után a hozzájárulás-sor megmarad (bizonyíték), újabb bekapcsolás új sort ad', { tag: '@regression' }, async ({ apiClient }) => {
    const account = await verified(apiClient)
    await enableWeeklySummary(account.client)

    const off = await disableWeeklySummary(account.client)
    expect(off.status).toBe(200)
    expect(off.body.data.weekly_summary).toBe(false)
    await enableWeeklySummary(account.client)

    expect(await summaryConsents(account.client)).toHaveLength(2)
  })

  test('a bekapcsoláshoz az adatkezelési tájékoztató látott verziója kell', { tag: '@regression' }, async ({ apiClient }) => {
    const account = await verified(apiClient)

    const result = await setWeeklySummary(account.client, { enabled: true })

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('privacy_version')
    expect((await account.client.me()).body.data.weekly_summary).toBe(false)
  })

  test('hiányzó vagy érvénytelen enabled érték 422', { tag: '@regression' }, async ({ apiClient }) => {
    const account = await verified(apiClient)

    for (const payload of [{}, { enabled: 'talán', privacy_version: '0.1' }]) {
      const result = await setWeeklySummary(account.client, payload)

      expect(result.status, JSON.stringify(payload)).toBe(422)
      expect(result.errorBody.errors).toHaveProperty('enabled')
    }
  })

  test('megerősítetlen e-mail-címmel nem kapcsolható be, érthető üzenettel', { tag: '@regression' }, async ({ apiClient }) => {
    const { client } = await apiClient.signUp(registration())

    const result = await enableWeeklySummary(client)

    expect(result.status).toBe(422)
    expect(result.errorBody.message).toContain('erősítsd meg')
    expect((await client.me()).body.data.weekly_summary).toBe(false)
  })

  test('a fiók törlése kikapcsolja és törli a küldés nyomát', { tag: '@regression' }, async ({ apiClient, request }) => {
    const account = await subscribed(apiClient)
    forceWeeklySummary(account.user.id, true, 1)

    expect(await deleteAccount(request, account.token, DEFAULT_PASSWORD)).toBe(204)

    expect(weeklySummaryState(account.user.id)).toEqual({ optIn: false, sentAt: null })
  })
})

test.describe('Heti összefoglaló e-mail (SendWeeklySummaries)', () => {
  test('aktív héten egy levél megy: magyar, ünneplő hangú, a héten történtekkel és leiratkozó linkkel', { tag: '@smoke' }, async ({ apiClient, outbox }) => {
    const account = await subscribed(apiClient)
    // A lecketeljesites es a beadas ugyanarra a napra esik, igy egyetlen tanulasi nap.
    const { body } = await weeklyRhythm(account.client)
    const todayIndex = body.data.days.findIndex((day) => day.date === body.data.today)
    plantLessonCompletion(account.user.id, todayIndex * 24 * 60 + 30)
    const taskId = await apiClient.taskIdByTitle(SEEDED.tasks.main)
    await account.client.submit({ task_id: taskId, language: 'python', source_code: ECHO_PROGRAM })

    runWeeklySummaries()

    expect(await summaryMails(outbox, account.user.email)).toBe(1)
    const mail = await outbox.latestTo(account.user.email)
    expect(mail.subject).toBe(SUMMARY_SUBJECT)
    const text = mail.text ?? ''
    expect(text).toContain('1 napon')
    expect(text).toContain('Befejezett leckék: 1')
    expect(text).toContain('Beadott megoldások: 1')
    expect(text).toContain('/tanulasi-ut')
    expect(unsubscribeLinkIn(text).id).toBe(String(account.user.id))
    expect(weeklySummaryState(account.user.id).sentAt).not.toBeNull()
  })

  test('a levélben nincs szemrehányó, nógató vagy veszteségről szóló szó', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const account = await subscribed(apiClient)
    plantLessonCompletion(account.user.id, 30)

    runWeeklySummaries()

    const text = ((await outbox.latestTo(account.user.email)).text ?? '').toLowerCase()
    for (const word of FORBIDDEN_WORDS) expect(text, word).not.toContain(word)
  })

  test('ugyanazon a héten a job másodszori futása nem küld újabb levelet', { tag: '@smoke' }, async ({ apiClient, outbox }) => {
    const account = await subscribed(apiClient)
    plantLessonCompletion(account.user.id, 30)

    runWeeklySummaries()
    runWeeklySummaries()

    expect(await summaryMails(outbox, account.user.email)).toBe(1)
  })

  test('egy hét múlva (a lefoglalás lejárta után) újra küld', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const account = await subscribed(apiClient)
    plantLessonCompletion(account.user.id, 30)
    runWeeklySummaries()

    forceWeeklySummary(account.user.id, true, 7)
    runWeeklySummaries()

    expect(await summaryMails(outbox, account.user.email)).toBe(2)
  })

  test('aki azon a héten nem tanult, nem kap levelet, és a lefoglalás sem foglalódik le', { tag: '@smoke' }, async ({ apiClient, outbox }) => {
    const account = await subscribed(apiClient)

    runWeeklySummaries()

    expect(await summaryMails(outbox, account.user.email)).toBe(0)
    expect(weeklySummaryState(account.user.id)).toEqual({ optIn: true, sentAt: null })
  })

  test('aki nem iratkozott fel, nem kap levelet, akkor sem, ha tanult', { tag: '@smoke' }, async ({ apiClient, outbox }) => {
    const account = await verified(apiClient)
    plantLessonCompletion(account.user.id, 30)

    runWeeklySummaries()

    expect(await summaryMails(outbox, account.user.email)).toBe(0)
  })

  test('megerősítetlen e-mail-címre nem megy levél', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const { user } = await apiClient.signUp(registration())
    forceWeeklySummary(user.id, true)
    plantLessonCompletion(user.id, 30)

    runWeeklySummaries()

    expect(await summaryMails(outbox, user.email)).toBe(0)
  })

  test('a leiratkozott (kikapcsolt) felhasználó nem kap levelet', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const account = await subscribed(apiClient)
    plantLessonCompletion(account.user.id, 30)
    await disableWeeklySummary(account.client)

    runWeeklySummaries()

    expect(await summaryMails(outbox, account.user.email)).toBe(0)
  })

  test('a törölt fiók nem kap levelet', { tag: '@regression' }, async ({ apiClient, outbox, request }) => {
    const account = await subscribed(apiClient)
    plantLessonCompletion(account.user.id, 30)
    expect(await deleteAccount(request, account.token, DEFAULT_PASSWORD)).toBe(204)

    runWeeklySummaries()

    expect(await summaryMails(outbox, account.user.email)).toBe(0)
  })
})

test.describe('Heti összefoglaló: leiratkozás a levél linkjéről (POST /notifications/weekly-summary/{id}/unsubscribe)', () => {
  /** Egy feliratkozott diák, akinek már megjött a levele; a levélbeli link paramétereit adja. */
  async function withMail(apiClient: ApiClient, outbox: Outbox) {
    const account = await subscribed(apiClient)
    plantLessonCompletion(account.user.id, 30)
    runWeeklySummaries()
    const link = unsubscribeLinkIn((await outbox.latestTo(account.user.email)).text ?? '')
    return { account, link }
  }

  test('érvényes aláírással bejelentkezés nélkül is kikapcsol, kedves üzenettel, és a hozzájárulás-sor megmarad', { tag: '@smoke' }, async ({ apiClient, outbox }) => {
    const { account, link } = await withMail(apiClient, outbox)

    const result = await unsubscribe(apiClient, link.id, link.signature)

    expect(result.status).toBe(200)
    expect(result.body.message).toContain('Nem küldünk több')
    expect(weeklySummaryState(account.user.id).optIn).toBe(false)
    expect((await account.client.me()).body.data.weekly_summary).toBe(false)
    expect(await summaryConsents(account.client)).toHaveLength(1)
  })

  test('a leiratkozás utáni újabb hét sem hoz levelet', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const { account, link } = await withMail(apiClient, outbox)
    await unsubscribe(apiClient, link.id, link.signature)
    forceWeeklySummary(account.user.id, false, 7)

    runWeeklySummaries()

    expect(await summaryMails(outbox, account.user.email)).toBe(1)
  })

  test('ismételt leiratkozás ugyanúgy siker', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const { link } = await withMail(apiClient, outbox)
    await unsubscribe(apiClient, link.id, link.signature)

    const again = await unsubscribe(apiClient, link.id, link.signature)

    expect(again.status).toBe(200)
  })

  test('más felhasználó azonosítójával a régi aláírás nem érvényes (403), és a másik fiók nem változik', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const { link } = await withMail(apiClient, outbox)
    const victim = await subscribed(apiClient)

    const forged = await unsubscribe(apiClient, String(victim.user.id), link.signature)

    expect(forged.status).toBe(403)
    expect(weeklySummaryState(victim.user.id).optIn).toBe(true)
  })

  test('aláírás nélkül és hibás aláírással 403', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const { account, link } = await withMail(apiClient, outbox)

    expect((await unsubscribe(apiClient, link.id)).status, 'aláírás nélkül').toBe(403)
    expect((await unsubscribe(apiClient, link.id, '0'.repeat(64))).status, 'hibás aláírás').toBe(403)
    expect(weeklySummaryState(account.user.id).optIn).toBe(true)
  })

  test('csak POST engedett: a GET (levélszűrők előzetes megnyitása) nem iratkoztat le', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const { account, link } = await withMail(apiClient, outbox)

    const result = await apiClient.get(`notifications/weekly-summary/${link.id}/unsubscribe`, { signature: link.signature })

    expect(result.status).toBe(405)
    expect(weeklySummaryState(account.user.id).optIn).toBe(true)
  })
})
