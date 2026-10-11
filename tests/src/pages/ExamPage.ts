import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** Gyakorlo vizsga: indito oldal es a futo vizsga. */
export class ExamPage extends BasePage {
  readonly startButton: Locator
  readonly timer: Locator
  readonly premiumLink: Locator

  constructor(page: Page) {
    super(page)
    this.startButton = page.getByRole('button', { name: 'Indítás' })
    this.timer = page.getByRole('timer')
    this.premiumLink = page.getByRole('link', { name: 'Prémium előfizetés' })
  }

  async gotoStart(examId: number): Promise<void> {
    await this.navigate(`/vizsgak/${examId}`)
  }

  async gotoRunner(examId: number, attemptId: number): Promise<void> {
    await this.navigate(`/vizsgak/${examId}/fut?proba=${attemptId}`)
  }
}
