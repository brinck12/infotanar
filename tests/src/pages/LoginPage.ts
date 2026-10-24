import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** A belepo oldal: e-mailes urlap es a "Folytatas Google-lel" gomb. */
export class LoginPage extends BasePage {
  readonly email: Locator
  readonly password: Locator
  readonly submitButton: Locator
  /** Csak akkor van a lapon, ha a szerver kinalja a Google-belepest. */
  readonly googleButton: Locator
  readonly googleError: Locator

  constructor(page: Page) {
    super(page)
    this.email = page.getByLabel('E-mail-cím')
    this.password = page.getByLabel('Jelszó', { exact: true })
    this.submitButton = page.getByRole('button', { name: 'Belépés' })
    this.googleButton = page.getByRole('button', { name: 'Folytatás Google-lel' })
    this.googleError = page.getByRole('alert')
  }

  async goto(path = '/bejelentkezes'): Promise<void> {
    await this.navigate(path)
  }

  async continueWithGoogle(): Promise<void> {
    await this.googleButton.click()
  }
}
