import { randomUUID } from 'node:crypto'
import { adminAccount, verifiedStudent } from '../../src/api/areas/accounts'
import {
  createInviteCode,
  disableInviteCode,
  joinWaitlist,
  listInviteCodes,
  listWaitlist,
  publicRegistration,
  setRegistrationMode,
  withRegistrationMode,
} from '../../src/api/areas/registrationGate'
import { registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'

/**
 * Zárt béta regisztrációs kapu (LAUNCH-2). A mód GLOBÁLIS, adatbázisban tárolt
 * beállítás, ezért a meghívós esetek sorban futnak, és minden teszt a végén
 * visszaállítja a módot (withRegistrationMode). Az api projekt egy workeres.
 */
test.describe.configure({ mode: 'serial' })

const uniqueLabel = (): string => `PW osztály ${randomUUID().slice(0, 8)}`

test.describe('Regisztrációs kapu: nyilvános mód', () => {
  test('GET /registration a módot adja, alapból open', { tag: '@smoke' }, async ({ apiClient }) => {
    const result = await publicRegistration(apiClient)

    expect(result.status).toBe(200)
    expect(result.body.data.mode).toBe('open')
  })

  test('nyitott módban a meghívókód nem kötelező', { tag: '@regression' }, async ({ apiClient }) => {
    expect((await apiClient.register(registration())).status).toBe(201)
  })
})

test.describe('Regisztrációs kapu: meghívós mód', () => {
  test('a mód váltása látszik a nyilvános végponton, és vissza is áll', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)

    await withRegistrationMode(admin, 'invite', async () => {
      expect((await publicRegistration(apiClient)).body.data.mode).toBe('invite')
    })

    expect((await publicRegistration(apiClient)).body.data.mode).toBe('open')
  })

  test('kód nélkül és ismeretlen kóddal 422 az invite_code mezőn', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)

    await withRegistrationMode(admin, 'invite', async () => {
      const missing = await apiClient.register(registration())
      expect(missing.status).toBe(422)
      expect(missing.errorBody.errors).toHaveProperty('invite_code')

      const unknown = await apiClient.register(registration({ invite_code: 'NINCS-ILYEN' }))
      expect(unknown.status).toBe(422)
      expect(unknown.errorBody.errors).toHaveProperty('invite_code')
    })
  })

  test('érvényes kóddal 201, a használat számlálódik, kis-nagybetűtől függetlenül', { tag: '@smoke' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const invite = await createInviteCode(admin, { label: uniqueLabel(), max_uses: 5 })

    await withRegistrationMode(admin, 'invite', async () => {
      const result = await apiClient.register(registration({ invite_code: invite.code.toLowerCase() }))
      expect(result.status).toBe(201)
    })

    const listed = (await listInviteCodes(admin)).body.data.find((row) => row.id === invite.id)
    expect(listed?.uses).toBe(1)
    expect(listed?.state).toBe('active')
  })

  test('a hibás regisztráció (gyenge jelszó) nem fogyasztja a kódot, és minden hiba együtt jön', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const invite = await createInviteCode(admin, { label: uniqueLabel(), max_uses: 1 })

    await withRegistrationMode(admin, 'invite', async () => {
      const rejected = await apiClient.register(registration({ invite_code: invite.code, password: 'rovid1', password_confirmation: 'rovid1', accept_terms: false }))
      expect(rejected.status).toBe(422)
      expect(Object.keys(rejected.errorBody.errors)).toEqual(expect.arrayContaining(['password', 'accept_terms']))

      expect((await apiClient.register(registration({ invite_code: invite.code }))).status).toBe(201)
    })
  })

  test('elfogyott kód (max_uses=1) a második regisztrációt elutasítja', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const invite = await createInviteCode(admin, { label: uniqueLabel(), max_uses: 1 })

    await withRegistrationMode(admin, 'invite', async () => {
      expect((await apiClient.register(registration({ invite_code: invite.code }))).status).toBe(201)

      const second = await apiClient.register(registration({ invite_code: invite.code }))
      expect(second.status).toBe(422)
      expect(second.errorBody.errors).toHaveProperty('invite_code')
    })

    const listed = (await listInviteCodes(admin)).body.data.find((row) => row.id === invite.id)
    expect(listed?.state).toBe('used_up')
  })

  test('két párhuzamos regisztráció egy max_uses=1 kódra: pontosan egy sikerül', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const invite = await createInviteCode(admin, { label: uniqueLabel(), max_uses: 1 })

    const statuses = await withRegistrationMode(admin, 'invite', async () => {
      const results = await Promise.all([
        apiClient.register(registration({ invite_code: invite.code })),
        apiClient.register(registration({ invite_code: invite.code })),
      ])
      return results.map((result) => result.status).sort()
    })

    expect(statuses).toEqual([201, 422])
    const listed = (await listInviteCodes(admin)).body.data.find((row) => row.id === invite.id)
    expect(listed?.uses).toBe(1)
  })

  test('letiltott kóddal 422', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const invite = await createInviteCode(admin, { label: uniqueLabel() })

    const disabled = await disableInviteCode(admin, invite.id)
    expect(disabled.status).toBe(200)
    expect(disabled.body.data.state).toBe('disabled')
    // Idempotens: a második letiltás is 200.
    expect((await disableInviteCode(admin, invite.id)).status).toBe(200)

    await withRegistrationMode(admin, 'invite', async () => {
      const result = await apiClient.register(registration({ invite_code: invite.code }))
      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty('invite_code')
    })
  })

  test('lejárt kóddal 422', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const invite = await createInviteCode(admin, { label: uniqueLabel(), expires_at: new Date(Date.now() + 3000).toISOString() })

    await expect
      .poll(async () => (await listInviteCodes(admin)).body.data.find((row) => row.id === invite.id)?.state, { timeout: 15_000 })
      .toBe('expired')

    await withRegistrationMode(admin, 'invite', async () => {
      const result = await apiClient.register(registration({ invite_code: invite.code }))
      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty('invite_code')
    })
  })

  test('a lejárat nem lehet múltbeli, a saját kód egyedi és formátumos', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)

    const past = await admin.post<unknown>('admin/invite-codes', { label: 'x', expires_at: '2020-01-01T00:00:00Z' })
    expect(past.status).toBe(422)

    const custom = `PW-${randomUUID().slice(0, 8).toUpperCase()}`
    const created = await createInviteCode(admin, { label: uniqueLabel(), code: custom })
    expect(created.code).toBe(custom)

    const duplicate = await admin.post<unknown>('admin/invite-codes', { label: 'masik', code: custom })
    expect(duplicate.status).toBe(422)

    const badFormat = await admin.post<unknown>('admin/invite-codes', { label: 'x', code: 'ékezetes kód!' })
    expect(badFormat.status).toBe(422)
  })

  test('a meghívós mód nem érinti a bejelentkezést', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const student = await verifiedStudent(apiClient, admin)

    await withRegistrationMode(admin, 'invite', async () => {
      expect((await apiClient.login({ email: student.user.email, password: registration().password })).status).toBe(200)
    })
  })
})

test.describe('Regisztrációs kapu: várólista', () => {
  test('feliratkozás semleges 202, ugyanarra a címre ismét is, és megjelenik az admin listában', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)
    const email = `pw-varolista-${randomUUID()}@example.test`

    const first = await joinWaitlist(apiClient, { email, note: '10.B' })
    const again = await joinWaitlist(apiClient, { email: email.toUpperCase() })

    expect(first.status).toBe(202)
    expect(again.status).toBe(202)
    expect(again.body.message).toBe(first.body.message)

    const rows = (await listWaitlist(admin)).body.data.filter((row) => row.email === email)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.note).toBe('10.B')
  })

  test('már regisztrált cím ugyanazt a választ kapja (nincs e-mail-felderítés)', { tag: '@regression' }, async ({ apiClient }) => {
    const payload = registration()
    expect((await apiClient.register(payload)).status).toBe(201)

    const known = await joinWaitlist(apiClient, { email: payload.email })
    const fresh = await joinWaitlist(apiClient, { email: `pw-uj-${randomUUID()}@example.test` })

    expect(known.status).toBe(fresh.status)
    expect(known.body.message).toBe(fresh.body.message)
  })

  test('érvénytelen vagy hiányzó e-mail 422', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await joinWaitlist(apiClient, { email: 'nem-email' })

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('email')
  })
})

test.describe('Regisztrációs kapu: admin jogosultság', () => {
  const endpoints: { method: 'get' | 'post' | 'put'; path: string; body?: unknown }[] = [
    { method: 'get', path: 'admin/registration' },
    { method: 'put', path: 'admin/registration', body: { mode: 'open' } },
    { method: 'get', path: 'admin/invite-codes' },
    { method: 'post', path: 'admin/invite-codes', body: { label: 'x' } },
    { method: 'post', path: 'admin/invite-codes/1/disable', body: {} },
    { method: 'get', path: 'admin/waitlist' },
  ]

  for (const endpoint of endpoints) {
    test(`${endpoint.method.toUpperCase()} ${endpoint.path}: vendég 401, diák 403`, { tag: '@regression' }, async ({ apiClient }) => {
      const { client: admin } = await adminAccount(apiClient)
      const student = await verifiedStudent(apiClient, admin)

      const calls = {
        get: (client: typeof apiClient) => client.get(endpoint.path),
        put: (client: typeof apiClient) => client.put(endpoint.path, endpoint.body),
        post: (client: typeof apiClient) => client.post(endpoint.path, endpoint.body),
      }
      const call = calls[endpoint.method]

      expect((await call(apiClient)).status).toBe(401)
      expect((await call(student.client)).status).toBe(403)
    })
  }

  test('érvénytelen mód 422', { tag: '@regression' }, async ({ apiClient }) => {
    const { client: admin } = await adminAccount(apiClient)

    const result = await admin.put<unknown>('admin/registration', { mode: 'zarva' })
    expect(result.status).toBe(422)
    expect((await setRegistrationMode(admin, 'open')).status).toBe(200)
  })
})
