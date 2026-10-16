import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** A lecke oldala: a leckeszöveg és benne a nyelvi lapfülek. */
export class LessonPage extends BasePage {
  readonly tablists: Locator
  readonly codeGroups: Locator

  constructor(page: Page) {
    super(page)
    this.tablists = page.getByRole('tablist', { name: 'Programozási nyelv' })
    this.codeGroups = page.getByRole('group', { name: 'Kódrészlet' })
  }

  async open(trackSlug: string, lessonSlug: string): Promise<void> {
    await this.navigate(`/tanulasi-ut/${trackSlug}/${lessonSlug}`)
  }

  languageTab(group: number, name: string): Locator {
    return this.tablists.nth(group).getByRole('tab', { name })
  }

  async chooseLanguage(group: number, name: string): Promise<void> {
    await this.languageTab(group, name).click()
  }
}
