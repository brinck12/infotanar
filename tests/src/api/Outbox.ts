import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect } from '@playwright/test'

export interface OutboxMail {
  to: string[]
  subject: string
  text: string | null
  html: string | null
}

/**
 * A helyi teszt-backend (MAIL_MAILER=outbox) altal JSON-kent kiirt
 * levelek olvasoja. Csak helyben/CI-ban mukodik, ahol a backend ugyanazon
 * a gepen fut; stagingen nincs outbox.
 */
export class Outbox {
  constructor(private readonly dir = path.resolve(__dirname, '../../../backend/storage/framework/outbox')) {}

  async all(): Promise<OutboxMail[]> {
    let files: string[]
    try {
      files = (await readdir(this.dir)).filter((f) => f.endsWith('.json')).sort()
    } catch {
      return []
    }
    return Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(this.dir, f), 'utf8')) as OutboxMail))
  }

  /** A cimzettnek kuldott legutolso level; a kuldes szinkron, de rovid ideig varunk. */
  async latestTo(address: string): Promise<OutboxMail> {
    const find = async (): Promise<OutboxMail | undefined> => (await this.all()).filter((m) => m.to.includes(address)).at(-1)
    await expect.poll(find, { message: `level erkezik ide: ${address}`, timeout: 5_000 }).toBeDefined()
    const mail = await find()
    if (!mail) throw new Error(`Nincs level ide: ${address}`)
    return mail
  }

  async countTo(address: string): Promise<number> {
    return (await this.all()).filter((m) => m.to.includes(address)).length
  }

  /** Az elso, a megadott utvonalra mutato link a level szoveges reszebol. */
  static linkTo(mail: OutboxMail, pathname: string): URL {
    const urls = (mail.text ?? '').match(/https?:\/\/[^\s)\]>]+/g) ?? []
    const url = urls.map((u) => new URL(u)).find((u) => u.pathname === pathname)
    if (!url) throw new Error(`Nincs ${pathname} link a levelben: ${mail.subject}`)
    return url
  }
}
