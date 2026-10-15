import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, test } from '../../src/fixtures'

/** A backend napi kliens-hibanaploja (a teszt-backend ugyanezen a gepen fut). */
function clientLogPath(): string {
  const today = new Date().toISOString().slice(0, 10)
  return path.resolve(__dirname, `../../../backend/storage/logs/client-${today}.log`)
}

async function readLog(): Promise<string> {
  try {
    return await readFile(clientLogPath(), 'utf8')
  } catch {
    return ''
  }
}

test.describe('Kliens-hibák naplózása', () => {
  test('az URL lekérdezése és töredéke nem kerül a naplóba, a hosszú szöveg csonkul', { tag: '@regression' }, async ({ apiClient }) => {
    const marker = `sanitize-${String(Date.now())}`
    const result = await apiClient.reportClientError({
      message: `${marker} ${'x'.repeat(400)}`,
      url: `https://infotanar.test/lecke/12?token=titkos-${marker}#reszlet-${marker}`,
      stack: 'y'.repeat(4000),
    })
    expect(result.status).toBe(204)

    await expect.poll(readLog, { message: 'a hiba bekerül a kliens naplóba' }).toContain(marker)
    const line = (await readLog()).split('\n').find((l) => l.includes(marker)) ?? ''

    expect(line).toContain('"url":"https://infotanar.test/lecke/12"')
    expect(line).not.toContain('titkos')
    expect(line).not.toContain('reszlet')
    expect(line).not.toContain('x'.repeat(400))
    expect(line).not.toContain('y'.repeat(2100))
  })
})
