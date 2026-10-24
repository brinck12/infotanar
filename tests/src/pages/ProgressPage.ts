import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * A heti ritmussav: a haladas oldalon (`/haladas`) es a tanulasi ut tetejen (`/tanulasi-ut`) is ugyanaz a kartya.
 * Szam es szeria nincs rajta; a heti osszefoglalo felkinalasa a kartya aljan egyszer jelenik meg.
 */
export class ProgressPage extends BasePage {
  readonly card: Locator
  readonly days: Locator
  readonly goalReached: Locator
  readonly offerQuestion: Locator
  readonly acceptOffer: Locator
  readonly declineOffer: Locator
  readonly offerThanks: Locator
  readonly offerError: Locator
  readonly pageHeading: Locator

  constructor(page: Page) {
    super(page)
    this.card = page.getByRole('region', { name: 'Heti ritmusod' })
    this.days = this.card.getByRole('img')
    this.goalReached = this.card.getByText('Megvan a heti ritmusod.')
    this.offerQuestion = this.card.getByText('Kérsz hetente egy rövid összefoglalót e-mailben?')
    this.acceptOffer = this.card.getByRole('button', { name: 'Kérem' })
    this.declineOffer = this.card.getByRole('button', { name: 'Most nem' })
    this.offerThanks = this.card.getByText('Rendben, hetente egy rövid összefoglalót kapsz.')
    this.offerError = this.card.getByRole('alert')
    this.pageHeading = page.getByRole('heading', { name: 'Haladásom' })
  }

  async goto(path = '/haladas'): Promise<void> {
    await this.navigate(path)
  }

  /** Egy nap jele a hozzaferheto neve alapjan, pl. `hétfő, volt tanulás` vagy `csütörtök (ma)`. */
  day(name: string): Locator {
    return this.card.getByRole('img', { name })
  }
}
