import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** A Fiokom oldal (`/fiok`): ertesitesek, es a jelszo nelkuli (Google-lel nyitott) fiok valtozatai. */
export class AccountPage extends BasePage {
  readonly weeklySummarySwitch: Locator
  readonly verifyEmailFirst: Locator
  readonly googleLinkedNote: Locator
  readonly setPasswordButton: Locator
  readonly setPasswordSent: Locator
  readonly passwordFirstNotes: Locator
  readonly changePasswordButton: Locator
  readonly deleteAccountButton: Locator

  constructor(page: Page) {
    super(page)
    this.weeklySummarySwitch = page.getByRole('switch', { name: 'Heti összefoglaló e-mailben' })
    this.verifyEmailFirst = page.getByText('Előbb erősítsd meg az e-mail-címedet.')
    this.googleLinkedNote = page.getByText('össze van kötve a Google-fiókoddal')
    this.setPasswordButton = page.getByRole('button', { name: 'Jelszó beállítása e-mailben' })
    this.setPasswordSent = page.getByText('Elküldtük a jelszó-visszaállító linket')
    this.passwordFirstNotes = page.getByText('jelszó kell, de a fiókod Google-lel nyílt')
    this.changePasswordButton = page.getByRole('button', { name: 'Jelszó módosítása' })
    this.deleteAccountButton = page.getByRole('button', { name: 'Fiók törlése' })
  }

  async goto(): Promise<void> {
    await this.navigate('/fiok')
  }
}
