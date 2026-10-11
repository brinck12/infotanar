import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** Admin: gyakorlo vizsga szerkesztese (idoszak, forras zip). */
export class AdminExamPage extends BasePage {
  readonly session: Locator
  readonly save: Locator
  readonly zipFile: Locator
  readonly uploadZip: Locator

  constructor(page: Page) {
    super(page)
    this.session = page.getByLabel('Vizsgaidőszak')
    this.save = page.getByRole('button', { name: 'Mentés', exact: true })
    this.zipFile = page.getByLabel('Forrásfájlok (zip)')
    this.uploadZip = page.getByRole('button', { name: 'Zip feltöltése' })
  }

  async goto(examId: number): Promise<void> {
    await this.navigate(`/admin/vizsgak/${examId}`)
  }

  fileDelete(name: string): Locator {
    return this.page.getByRole('button', { name: `${name} törlése` })
  }

  fileLink(name: string): Locator {
    return this.page.getByRole('link', { name: `${name} letöltése` })
  }

  async attachZip(name: string): Promise<void> {
    await this.zipFile.setInputFiles({ name, mimeType: 'application/zip', buffer: Buffer.from('PK') })
    await this.uploadZip.click()
  }
}
