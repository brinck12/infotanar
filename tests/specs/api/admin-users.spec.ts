import type { ApiClient, ApiResult } from '../../src/api/ApiClient'
import { Outbox } from '../../src/api/Outbox'
import { DEFAULT_PASSWORD, registration, SEEDED } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const RESET_PATH = '/jelszo-visszaallitas'
const UNKNOWN_USER_ID = 999_999
const UNKNOWN_PAYMENT_ID = '00000000-0000-4000-8000-000000000000'

/** A #162 minden végpontja; a jogosultsági tesztek mindegyiken végigmennek. */
const ROUTES: { name: string; call: (client: ApiClient, userId: number) => Promise<ApiResult<unknown>> }[] = [
  { name: 'szerepkör-váltás', call: (client, userId) => client.adminChangeRole(userId, 'admin') },
  { name: 'megerősítő levél újraküldése', call: (client, userId) => client.adminResendVerification(userId) },
  { name: 'kézi megerősítés', call: (client, userId) => client.adminVerifyEmail(userId, 'Teszt indoklás') },
  { name: 'munkamenetek visszavonása', call: (client, userId) => client.adminRevokeTokens(userId) },
  { name: 'jelszó-visszaállító levél', call: (client, userId) => client.adminSendPasswordReset(userId) },
  { name: 'fizetések', call: (client, userId) => client.adminUserPayments(userId) },
  { name: 'számla letöltése', call: (client, userId) => client.adminUserInvoice(userId, UNKNOWN_PAYMENT_ID) },
]

test.describe('Admin felhasználó-kezelés (/admin/users/{user}/…)', () => {
  // A rögzített admin az egyetlen admin a fixture adatbázisban. Egyszer lép be,
  // mert a bejelentkezés percenként korlátozott; a tesztek a szerepkörét nem változtatják.
  let adminToken = ''
  let adminId = 0

  test.beforeAll(async ({ apiClient }) => {
    const login = await apiClient.login({ email: SEEDED.accounts.admin, password: DEFAULT_PASSWORD })
    expect(login.status).toBe(200)
    adminToken = login.body.data.token
    adminId = login.body.data.user.id
  })

  test.describe('jogosultság', () => {
    test('bejelentkezés nélkül minden végpont 401', { tag: '@regression' }, async ({ apiClient }) => {
      for (const route of ROUTES) {
        const result = await route.call(apiClient, adminId)

        expect(result.status, route.name).toBe(401)
      }
    })

    test('diák minden végponton 403-at kap, nem létező felhasználónál is', { tag: '@smoke' }, async ({ apiClient }) => {
      const student = await apiClient.signUp(registration())
      const target = await apiClient.signUp(registration())

      for (const route of ROUTES) {
        const existing = await route.call(student.client, target.user.id)
        // Nem 404: a diák így nem tudja kitapogatni, mely azonosítók léteznek.
        const unknown = await route.call(student.client, UNKNOWN_USER_ID)

        expect(existing.status, route.name).toBe(403)
        expect(unknown.status, `${route.name} (nem létező felhasználó)`).toBe(403)
      }

      expect((await target.client.me()).body.data.role).toBe('student')
    })

    test('admin nem létező felhasználóra 404-et kap', { tag: '@regression' }, async ({ apiClient }) => {
      const admin = apiClient.withToken(adminToken)

      expect((await admin.adminUserPayments(UNKNOWN_USER_ID)).status).toBe(404)
      expect((await admin.adminChangeRole(UNKNOWN_USER_ID, 'admin')).status).toBe(404)
    })
  })

  test.describe('szerepkör', () => {
    test('az admin a saját szerepkörét nem változtathatja meg, így az egyetlen admin megmarad', { tag: '@smoke' }, async ({ apiClient }) => {
      const admin = apiClient.withToken(adminToken)

      const result = await admin.adminChangeRole(adminId, 'student')

      expect(result.status).toBe(403)
      expect((await admin.me()).body.data.role).toBe('admin')
    })

    test('admin kinevezhet és visszafokozhat egy másik felhasználót', { tag: '@smoke' }, async ({ apiClient }) => {
      const admin = apiClient.withToken(adminToken)
      const other = await apiClient.signUp(registration())
      const bystander = await apiClient.signUp(registration())
      expect((await other.client.adminUserPayments(bystander.user.id)).status).toBe(403)

      const promoted = await admin.adminChangeRole(other.user.id, 'admin')

      expect(promoted.status).toBe(200)
      expect(promoted.body.data).toEqual({ id: other.user.id, role: 'admin' })
      expect((await other.client.adminUserPayments(bystander.user.id)).status).toBe(200)

      const demoted = await admin.adminChangeRole(other.user.id, 'student')

      expect(demoted.status).toBe(200)
      expect(demoted.body.data).toEqual({ id: other.user.id, role: 'student' })
      expect((await other.client.adminUserPayments(bystander.user.id)).status).toBe(403)
    })

    test('admin fiókot más admin sem törölhet', { tag: '@regression' }, async ({ apiClient }) => {
      const admin = apiClient.withToken(adminToken)
      const other = await apiClient.signUp(registration())
      await admin.adminChangeRole(other.user.id, 'admin')

      const fromSeeded = await admin.adminDeleteUser(other.user.id)
      const fromPromoted = await other.client.adminDeleteUser(adminId)

      expect(fromSeeded.status).toBe(403)
      expect(fromPromoted.status).toBe(403)
      expect((await admin.me()).status).toBe(200)

      // Rendrakás: a többi teszt egyetlen adminnal számol.
      expect((await admin.adminChangeRole(other.user.id, 'student')).status).toBe(200)
    })

    test('a már meglévő szerepkör újbóli beállítása nem hiba', { tag: '@regression' }, async ({ apiClient }) => {
      const admin = apiClient.withToken(adminToken)
      const other = await apiClient.signUp(registration())

      const result = await admin.adminChangeRole(other.user.id, 'student')

      expect(result.status).toBe(200)
      expect(result.body.data.role).toBe('student')
    })

    test('ismeretlen szerepkör 422', { tag: '@regression' }, async ({ apiClient }) => {
      const admin = apiClient.withToken(adminToken)
      const other = await apiClient.signUp(registration())

      const result = await admin.adminChangeRole(other.user.id, 'tanar')

      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty('role')
      expect((await other.client.me()).body.data.role).toBe('student')
    })
  })

  test.describe('megerősítés, munkamenetek, jelszó', () => {
    test('az admin a saját fiókján ezeket a műveleteket nem érheti el', { tag: '@regression' }, async ({ apiClient }) => {
      const admin = apiClient.withToken(adminToken)

      expect((await admin.adminResendVerification(adminId)).status).toBe(403)
      expect((await admin.adminVerifyEmail(adminId, 'Teszt indoklás')).status).toBe(403)
      expect((await admin.adminRevokeTokens(adminId)).status).toBe(403)
      expect((await admin.adminSendPasswordReset(adminId)).status).toBe(403)
      // A token él: a visszavonás nem futott le.
      expect((await admin.me()).status).toBe(200)
    })

    test('megerősítő levél újraküldése meg nem erősített fióknak', { tag: '@regression' }, async ({ apiClient, outbox }) => {
      const admin = apiClient.withToken(adminToken)
      const user = await apiClient.signUp(registration())
      await outbox.latestTo(user.user.email)
      const before = await outbox.countTo(user.user.email)

      const result = await admin.adminResendVerification(user.user.id)

      expect(result.status).toBe(202)
      expect(result.body.message).toBeTruthy()
      await expect.poll(() => outbox.countTo(user.user.email)).toBe(before + 1)
    })

    test('kézi megerősítés csak indoklással, és csak egyszer', { tag: '@smoke' }, async ({ apiClient }) => {
      const admin = apiClient.withToken(adminToken)
      const user = await apiClient.signUp(registration())
      expect((await user.client.me()).body.data.email_verified_at).toBeNull()

      const withoutReason = await admin.adminVerifyEmail(user.user.id)

      expect(withoutReason.status).toBe(422)
      expect(withoutReason.errorBody.errors).toHaveProperty('reason')
      expect((await user.client.me()).body.data.email_verified_at).toBeNull()

      const verified = await admin.adminVerifyEmail(user.user.id, 'A levelezője szűri a leveleinket.')

      expect(verified.status).toBe(204)
      expect((await user.client.me()).body.data.email_verified_at).not.toBeNull()

      // Megerősített fióknál mindkét művelet értelmetlen: 409, érthető üzenettel.
      const again = await admin.adminVerifyEmail(user.user.id, 'Még egyszer')
      const resend = await admin.adminResendVerification(user.user.id)

      expect(again.status).toBe(409)
      expect(resend.status).toBe(409)
      expect(resend.body.message).toBeTruthy()
    })

    test('a munkamenetek visszavonása minden tokent érvénytelenít', { tag: '@smoke' }, async ({ apiClient }) => {
      const admin = apiClient.withToken(adminToken)
      const payload = registration()
      const first = await apiClient.signUp(payload)
      const second = await apiClient.login({ email: payload.email, password: DEFAULT_PASSWORD })
      expect((await first.client.me()).status).toBe(200)

      const result = await admin.adminRevokeTokens(first.user.id)

      expect(result.status).toBe(204)
      expect((await first.client.me()).status).toBe(401)
      expect((await apiClient.withToken(second.body.data.token).me()).status).toBe(401)
    })

    test('jelszó-visszaállító levél megy a felhasználónak, a túl gyakori kérés 429', { tag: '@regression' }, async ({ apiClient, outbox }) => {
      const admin = apiClient.withToken(adminToken)
      const user = await apiClient.signUp(registration())

      const sent = await admin.adminSendPasswordReset(user.user.id)

      expect(sent.status).toBe(202)
      const link = Outbox.linkTo(await outbox.latestTo(user.user.email), RESET_PATH)
      expect(link.searchParams.get('token')).toBeTruthy()

      // A régi jelszó érvényes marad: az admin nem állít be jelszót.
      expect((await user.client.me()).status).toBe(200)

      const tooSoon = await admin.adminSendPasswordReset(user.user.id)

      expect(tooSoon.status).toBe(429)
      expect(tooSoon.body.message).toBeTruthy()
    })
  })

  test.describe('fizetések', () => {
    test('fizetés nélküli felhasználónál üres lista, ismeretlen számlánál 404', { tag: '@regression' }, async ({ apiClient }) => {
      const admin = apiClient.withToken(adminToken)
      const user = await apiClient.signUp(registration())

      const payments = await admin.adminUserPayments(user.user.id)
      const invoice = await admin.adminUserInvoice(user.user.id, UNKNOWN_PAYMENT_ID)

      expect(payments.status).toBe(200)
      expect(payments.body.data).toEqual([])
      expect(invoice.status).toBe(404)
    })

    test('az admin a saját fizetéseit is megnézheti', { tag: '@regression' }, async ({ apiClient }) => {
      const result = await apiClient.withToken(adminToken).adminUserPayments(adminId)

      expect(result.status).toBe(200)
    })
  })
})
