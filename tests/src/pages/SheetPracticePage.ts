import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** Bongeszos tablazatos gyakorlo: a munkalap, a cellan beluli szerkesztes es az ellenorzolista. */
export class SheetPracticePage extends BasePage {
  readonly errorHint: Locator
  readonly progress: Locator

  constructor(page: Page) {
    super(page)
    this.errorHint = page.getByTestId('sheet-error-hint')
    this.progress = page.getByText(/\d+ \/ \d+ kész/)
  }

  async open(taskId: number): Promise<void> {
    await this.navigate(`/feladatok/${taskId}`)
  }

  cell(name: string): Locator {
    return this.page.locator(`[data-cell="${name}"]`)
  }

  /** Rakattint a cellara, begepeli a szoveget es lezarja Entert (vagy Tabot) nyomva. */
  async typeInto(name: string, text: string, finish: 'Enter' | 'Tab' = 'Enter'): Promise<void> {
    await this.cell(name).click()
    await this.page.keyboard.type(text)
    await this.page.keyboard.press(finish)
  }
}
