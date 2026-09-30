import type { RegisterRequest } from '../../src/api/types'
import { registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'

test.describe('Regisztráció (/auth/register)', () => {
  test('érvényes adatokkal 201, és a jelszó nem szivárog ki', { tag: '@smoke' }, async ({ apiClient }) => {
    const payload = registration()

    const result = await apiClient.register(payload)

    expect(result.status).toBe(201)
    const user = result.body.data
    expect(user.id).toBeTruthy()
    expect(user.email).toBe(payload.email)
    expect(user.role).toBe('student')
    expect(user.email_verified_at).toBeNull()
    expect(user).not.toHaveProperty('password')
    expect(user).not.toHaveProperty('remember_token')
  })

  test('a kliens nem adhat magának admin szerepkört', { tag: '@regression' }, async ({ apiClient }) => {
    const result = await apiClient.register({ ...registration(), role: 'admin' } as RegisterRequest)

    expect(result.status).toBe(201)
    expect(result.body.data.role).toBe('student')
  })

  test('már regisztrált e-mail-cím 422, kis-nagybetűtől függetlenül', { tag: '@regression' }, async ({ apiClient }) => {
    const payload = registration()
    expect((await apiClient.register(payload)).status).toBe(201)

    const duplicate = await apiClient.register({ ...payload, email: payload.email.toUpperCase() })

    expect(duplicate.status).toBe(422)
    expect(duplicate.errorBody.errors).toHaveProperty('email')
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
