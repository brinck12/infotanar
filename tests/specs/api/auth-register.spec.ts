import type { RegisterRequest } from '../../src/api/types'
import { registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'

test.describe('Regisztráció (/auth/register)', () => {
  test('érvényes adatokkal 201 semleges üzenettel, a jelszó nem szivárog ki', { tag: '@smoke' }, async ({ apiClient }) => {
    const payload = registration()

    const result = await apiClient.register(payload)

    expect(result.status).toBe(201)
    expect(result.body.message).toBeTruthy()
    expect(JSON.stringify(result.body)).not.toContain(payload.password)
    const login = await apiClient.login({ email: payload.email, password: payload.password })
    expect(login.body.data.user.email).toBe(payload.email)
    expect(login.body.data.user.email_verified_at).toBeNull()
  })

  test('a kliens nem adhat magának admin szerepkört', { tag: '@regression' }, async ({ apiClient }) => {
    const payload = registration()
    const result = await apiClient.register({ ...payload, role: 'admin' } as RegisterRequest)

    expect(result.status).toBe(201)
    const login = await apiClient.login({ email: payload.email, password: payload.password })
    expect(login.body.data.user.role).toBe('student')
  })

  test('már regisztrált e-mail-cím ugyanazt a választ kapja, a tulajdonos tájékoztató levelet', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const payload = registration()
    const first = await apiClient.register(payload)
    expect(first.status).toBe(201)
    const before = await outbox.countTo(payload.email)

    const duplicate = await apiClient.register({ ...payload, email: payload.email.toUpperCase(), password: 'Masik1234', password_confirmation: 'Masik1234' })

    expect(duplicate.status).toBe(201)
    expect(duplicate.body).toEqual(first.body)
    await expect.poll(() => outbox.countTo(payload.email)).toBe(before + 1)
    expect((await outbox.latestTo(payload.email)).subject).toContain('Már van fiókod')
    // A meglévő jelszó nem változott.
    expect((await apiClient.login({ email: payload.email, password: payload.password })).status).toBe(200)
  })

  test('eltérő jelszó-megerősítés 422', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await apiClient.register(registration({ password_confirmation: 'Masik1234' }))

    expect(result.status).toBe(422)
    expect(result.errorBody.errors).toHaveProperty('password')
  })

  for (const weak of ['rovid1', 'csakbetuk', '12345678']) {
    test(`gyenge jelszó (${weak}) 422`, { tag: '@regression' }, async ({ apiClient }) => {
      const result = await apiClient.register(registration({ password: weak, password_confirmation: weak }))

      expect(result.status).toBe(422)
      expect(result.errorBody.errors).toHaveProperty('password')
    })
  }

  test('hiányzó mezők 422, mezőnkénti hibával', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await apiClient.register({})

    expect(result.status).toBe(422)
    expect(Object.keys(result.errorBody.errors)).toEqual(expect.arrayContaining(['name', 'email', 'password']))
  })
})
