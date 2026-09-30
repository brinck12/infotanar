import { Outbox } from '../../src/api/Outbox'
import { DEFAULT_PASSWORD, registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'

test.describe('Bejelentkezés és kijelentkezés (/auth/login, /auth/logout)', () => {
  test('helyes adatokkal tokent kap, amivel eléri a védett végpontot', { tag: '@smoke' }, async ({ apiClient }) => {
    const payload = registration()
    await apiClient.register(payload)

    const login = await apiClient.login({ email: payload.email, password: DEFAULT_PASSWORD })

    expect(login.status).toBe(200)
    expect(login.body.data.token_type).toBe('Bearer')
    expect(login.body.data.user.email).toBe(payload.email)
    expect(login.body.data.user).not.toHaveProperty('password')

    const me = await apiClient.withToken(login.body.data.token).me()
    expect(me.status).toBe(200)
    expect(me.body.data.email).toBe(payload.email)
  })

  test('az e-mail-cím kis-nagybetűtől függetlenül működik', { tag: '@regression' }, async ({ apiClient }) => {
    const payload = registration()
    await apiClient.register(payload)

    const login = await apiClient.login({ email: payload.email.toUpperCase(), password: DEFAULT_PASSWORD })

    expect(login.status).toBe(200)
  })

  test('hibás jelszó 401, ugyanazzal az üzenettel, mint a nem létező fiók', { tag: '@regression' }, async ({ apiClient }) => {
    const payload = registration()
    await apiClient.register(payload)

    const wrongPassword = await apiClient.login({ email: payload.email, password: 'Rossz12345' })
    const unknownUser = await apiClient.login({ email: registration().email, password: DEFAULT_PASSWORD })

    expect(wrongPassword.status).toBe(401)
    expect(unknownUser.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownUser.body)
  })

  test('hiányzó mezők 422', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await apiClient.login({})

    expect(result.status).toBe(422)
    expect(Object.keys(result.errorBody.errors)).toEqual(expect.arrayContaining(['email', 'password']))
  })

  test('token nélkül és hamis tokennel a védett végpont 401', { tag: '@regression' }, async ({ apiClient }) => {
    const anonymous = await apiClient.me()
    const forged = await apiClient.withToken('1|hamis-token').me()

    expect(anonymous.status).toBe(401)
    expect(forged.status).toBe(401)
    expect(anonymous.body).toHaveProperty('message')
  })

  test('kijelentkezés csak az aktuális tokent vonja vissza', { tag: '@regression' }, async ({ apiClient }) => {
    const payload = registration()
    const { client: first } = await apiClient.signUp(payload)
    const second = await apiClient.login({ email: payload.email, password: DEFAULT_PASSWORD })
    const secondClient = apiClient.withToken(second.body.data.token)

    expect((await first.logout()).status).toBe(204)

    expect((await first.me()).status).toBe(401)
    expect((await secondClient.me()).status).toBe(200)
  })

  test('sok hibás próbálkozás után 429', { tag: '@regression' }, async ({ apiClient }) => {
    const payload = registration()
    await apiClient.register(payload)

    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      statuses.push((await apiClient.login({ email: payload.email, password: 'Rossz12345' })).status)
    }

    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401])
    expect(statuses[5]).toBe(429)
  })
})

test.describe('Megerősítő levél újraküldése', () => {
  test('bejelentkezett, nem megerősített felhasználó új levelet kap', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const payload = registration()
    const { client } = await apiClient.signUp(payload)
    await outbox.latestTo(payload.email)
    const before = await outbox.countTo(payload.email)

    const result = await client.resendVerification()

    expect(result.status).toBe(202)
    await expect.poll(() => outbox.countTo(payload.email)).toBe(before + 1)
  })

  test('megerősítés után a /me már megerősítettként mutatja', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const payload = registration()
    const { client } = await apiClient.signUp(payload)
    const link = Outbox.linkTo(await outbox.latestTo(payload.email), '/email-megerosites')

    await apiClient.verifyEmail(link.searchParams)

    const me = await client.me()
    expect(me.body.data.email_verified_at).not.toBeNull()
    expect((await client.resendVerification()).status).toBe(200)
  })

  test('token nélkül 401', { tag: '@regression' }, async ({ apiClient }) => {
    expect((await apiClient.resendVerification()).status).toBe(401)
  })
})
