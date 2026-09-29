import type { Page } from '@playwright/test'

/**
 * Minden oldalobjektum ose. Az oldalobjektum a felulet "hogyan"-jat
 * rejti el (lokatorok, lepesek); a "mit" (elvarasok) a specben marad.
 * A lokatorok szerep, felirat vagy data-testid alapuak, sosem CSS
 * szerkezetre epulnek.
 */
export abstract class BasePage {
  constructor(readonly page: Page) {}

  /** Navigalas a baseURL-hez kepest relativ utvonalra. */
  protected async navigate(path: string): Promise<void> {
    await this.page.goto(path)
  }
}
