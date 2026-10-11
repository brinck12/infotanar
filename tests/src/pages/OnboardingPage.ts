import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** Indulas: a tanulasi celok urlapja. */
export class OnboardingPage extends BasePage {
  readonly emelt: Locator
  readonly kozep: Locator
  readonly csharp: Locator
  readonly period: Locator
  readonly submitButton: Locator
  readonly saveError: Locator
  readonly serverStorageNote: Locator
  readonly browserStorageNote: Locator

  constructor(page: Page) {
    super(page)
    this.emelt = page.getByRole('radio', { name: /Emelt szint/ })
    this.kozep = page.getByRole('radio', { name: /Középszint/ })
    this.csharp = page.getByRole('radio', { name: 'C#' })
    this.period = page.getByLabel('Vizsgaidőszak')
    this.submitButton = page.getByRole('button', { name: 'Kész, kezdjük' })
    this.saveError = page.getByText('Nem sikerült elmenteni a céljaidat')
    this.serverStorageNote = page.getByText('A beállításaidat a fiókodhoz mentjük')
    this.browserStorageNote = page.getByText('A beállításaidat egyelőre ez a böngésző őrzi meg')
  }

  async goto(): Promise<void> {
    await this.navigate('/indulas')
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }
}
