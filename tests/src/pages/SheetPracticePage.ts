import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** Bongeszos tablazatos gyakorlo: munkalap, kepletsav es ellenorzolista. */
export class SheetPracticePage extends BasePage {
  readonly formulaBar: Locator

  constructor(page: Page) {
    super(page)
    this.formulaBar = page.getByLabel(/cella tartalma/)
  }

  async goto(taskId: number): Promise<void> {
    await this.navigate(`/feladatok/${taskId}`)
  }

  /** A munkalap egy cellaja (a felirata `B3: 12` alaku). */
  cell(name: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${name}:`) })
  }

  /** Kozvetlen szerkesztes: a cellara gepelve a kepletsavban folytatodik a beiras, Enter beirja. */
  async typeIntoCell(name: string, text: string): Promise<void> {
    await this.cell(name).focus()
    await this.page.keyboard.press(text.slice(0, 1))
    await this.page.keyboard.type(text.slice(1))
    await this.page.keyboard.press('Enter')
  }

  /** Egy ellenorzolista-tetel szovege (a tippel egyutt). */
  checkItem(label: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: label })
  }
}
