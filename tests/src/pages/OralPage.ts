import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** Szobeli: a temak listaja es egy tema gyakorlasa. */
export class OralPage extends BasePage {
  readonly notes: Locator
  readonly startPreparation: Locator
  readonly startAnswer: Locator
  readonly finishAnswer: Locator
  readonly recorded: Locator
  readonly loadError: Locator

  constructor(page: Page) {
    super(page)
    this.notes = page.getByLabel('Jegyzeteid')
    this.startPreparation = page.getByRole('button', { name: 'Felkészülés indítása' })
    this.startAnswer = page.getByRole('button', { name: 'Felelet indítása' })
    this.finishAnswer = page.getByRole('button', { name: 'Felelet vége' })
    this.loadError = page.getByText('Nem sikerült betölteni a gyakorlásodat')
    this.recorded = page.getByText('A gyakorlást rögzítettük')
  }

  async gotoList(): Promise<void> {
    await this.navigate('/szobeli')
  }

  async gotoTopic(slug: string): Promise<void> {
    await this.navigate(`/szobeli/${slug}`)
  }

  /** A lista egy temajanak kartyaja (a gyakorlasok szamaval a szovegeben). */
  topicCard(title: string): Locator {
    return this.page.getByRole('link', { name: new RegExp(title) })
  }

  outlineItem(label: RegExp): Locator {
    return this.page.getByRole('checkbox', { name: label })
  }

  async practiceOnce(): Promise<void> {
    await this.startPreparation.click()
    await this.startAnswer.click()
    await this.finishAnswer.click()
  }
}
