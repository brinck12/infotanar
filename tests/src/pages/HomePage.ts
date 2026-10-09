import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** A kezdolap: hos az elo mintaval, a hat tanulasi ut es az arak. */
export class HomePage extends BasePage {
  readonly heading: Locator
  readonly mainNav: Locator
  readonly menuButton: Locator
  readonly firstTaskLink: Locator
  readonly demo: Locator
  readonly demoRunButton: Locator
  readonly demoSubmitButton: Locator
  readonly demoFixButton: Locator
  readonly demoResults: Locator
  readonly price: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { level: 1 })
    this.mainNav = page.getByRole('navigation', { name: 'Főmenü' })
    this.menuButton = page.getByRole('button', { name: 'Menü' })
    this.firstTaskLink = page.getByRole('link', { name: 'Első feladat megnyitása' })
    this.demo = page.getByTestId('live-demo')
    this.demoRunButton = this.demo.getByRole('button', { name: 'Futtatás' })
    this.demoSubmitButton = this.demo.getByRole('button', { name: 'Beadás' })
    this.demoFixButton = this.demo.getByRole('button', { name: 'Javítsd ki a hibát' })
    this.demoResults = this.demo.getByTestId('test-result')
    this.price = page.getByText('2 990 Ft')
  }

  async goto(): Promise<void> {
    await this.navigate('/')
  }

  navLink(name: string): Locator {
    return this.mainNav.getByRole('link', { name })
  }

  async fixAndSubmitDemo(): Promise<void> {
    await this.demoFixButton.click()
    await this.demoSubmitButton.click()
  }

  async openMenu(): Promise<void> {
    await this.menuButton.click()
  }
}
