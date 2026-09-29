import { Outbox } from '../../src/api/Outbox'
import { registration } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const VERIFY_PATH = '/email-megerosites'

test.describe('E-mail-megerősítés (/auth/verify-email)', () => {
  test('regisztráció után aláírt megerősítő link érkezik, ami megerősíti a fiókot', { tag: '@smoke' }, async ({ apiClient, outbox }) => {
    const payload = registration()
    expect((await apiClient.register(payload)).status).toBe(201)

    const mail = await outbox.latestTo(payload.email)
    const link = Outbox.linkTo(mail, VERIFY_PATH)
    expect(link.searchParams.get('signature')).toBeTruthy()
    expect(link.searchParams.get('expires')).toBeTruthy()

    const result = await apiClient.verifyEmail(link.searchParams)

    expect(result.status).toBe(200)
  })

  test('a link másodszori megnyitása sem hibázik', { tag: '@regression' }, async ({ apiClient, outbox }) => {
    const payload = registration()
    await apiClient.register(payload)
    const link = Outbox.linkTo(await outbox.latestTo(payload.email), VERIFY_PATH)

    expect((await apiClient.verifyEmail(link.searchParams)).status).toBe(200)
    expect((await apiClient.verifyEmail(link.searchParams)).status).toBe(200)
  })

  const tamperings: Record<string, (p: URLSearchParams) => void> = {
    'módosított aláírás': (p) => {
      p.set('signature', '0'.repeat(64))
    },
    'meghosszabbított lejárat': (p) => {
      p.set('expires', String(Number(p.get('expires')) + 3600))
    },
    'lejárt időbélyeg': (p) => {
      p.set('expires', String(Math.floor(Date.now() / 1000) - 60))
    },
    'hiányzó aláírás': (p) => {
      p.delete('signature')
    },
    'másik felhasználó azonosítója': (p) => {
      p.set('id', String(Number(p.get('id')) + 1000))
    },
  }

  for (const [name, tamper] of Object.entries(tamperings)) {
    test(`manipulált link elutasítva: ${name}`, { tag: '@regression' }, async ({ apiClient, outbox }) => {
      const payload = registration()
      await apiClient.register(payload)
      const params = Outbox.linkTo(await outbox.latestTo(payload.email), VERIFY_PATH).searchParams
      tamper(params)

      const result = await apiClient.verifyEmail(params)

      expect(result.status).toBe(403)
      expect(result.body.message).toMatch(/érvénytelen|lejárt/i)
    })
  }
})
