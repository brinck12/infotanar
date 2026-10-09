import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class TaskListPage extends BasePage {
  readonly heading: Locator
  readonly taskCards: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Feladatok', exact: true })
    this.taskCards = page.getByTestId('task-card')
  }

  async goto(): Promise<void> {
    await this.navigate('/feladatok')
  }

  taskCard(title: string): Locator {
    return this.taskCards.filter({ hasText: title })
  }

  async openTask(title: string): Promise<void> {
    await this.taskCard(title).click()
  }
}
