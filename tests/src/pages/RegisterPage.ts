import type { Locator, Page } from '@playwright/test'
import type { RegisterRequest } from '../api/types'
import { BasePage } from './BasePage'

/** A regisztracios urlap. */
export class RegisterPage extends BasePage {
  readonly name: Locator
  readonly email: Locator
  readonly password: Locator
  readonly passwordConfirmation: Locator
  readonly acceptTerms: Locator
  readonly termsLink: Locator
  readonly submitButton: Locator
  readonly termsError: Locator

  constructor(page: Page) {
    super(page)
    this.name = page.getByLabel('Név')
    this.email = page.getByLabel('E-mail-cím')
    this.password = page.getByLabel('Jelszó', { exact: true })
    this.passwordConfirmation = page.getByLabel('Jelszó újra')
    this.acceptTerms = page.getByRole('checkbox', { name: /Elfogadom/ })
    this.termsLink = page.getByRole('link', { name: /általános szerződési feltételeket/ })
    this.submitButton = page.getByRole('button', { name: 'Fiók létrehozása' })
    this.termsError = page.getByText('A regisztrációhoz fogadd el a feltételeket és a tájékoztatót.')
  }

  async goto(): Promise<void> {
    await this.navigate('/regisztracio')
  }

  /** Kitolti a szoveges mezoket; az elfogadas kulon lepes. */
  async fillForm(payload: Pick<RegisterRequest, 'name' | 'email' | 'password' | 'password_confirmation'>): Promise<void> {
    await this.name.fill(payload.name)
    await this.email.fill(payload.email)
    await this.password.fill(payload.password)
    await this.passwordConfirmation.fill(payload.password_confirmation)
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }
}
