import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** A tanulasi ut: a pontok megoszlasa es savonkent a szakaszok. */
export class LearningPathPage extends BasePage {
  readonly heading: Locator
  readonly pointsBar: Locator
  readonly levelSwitch: Locator
  readonly trackTabs: Locator
  readonly stages: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { level: 1 })
    this.pointsBar = page.getByRole('img', { name: /pont$/ })
    this.levelSwitch = page.getByRole('group', { name: 'Szint' })
    this.trackTabs = page.getByRole('tablist', { name: 'Sávok' })
    this.stages = page.getByRole('tabpanel').getByRole('listitem')
  }

  async goto(): Promise<void> {
    await this.navigate('/tanulasi-ut')
  }

  trackTab(name: string): Locator {
    return this.trackTabs.getByRole('tab', { name })
  }

  lessonLink(title: string): Locator {
    return this.page.getByRole('tabpanel').getByRole('link', { name: title })
  }

  async chooseLevel(label: string): Promise<void> {
    await this.levelSwitch.getByRole('button', { name: label }).click()
  }

  async openLesson(title: string): Promise<void> {
    await this.lessonLink(title).click()
  }
}
