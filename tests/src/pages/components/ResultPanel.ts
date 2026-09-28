import type { Locator, Page } from '@playwright/test'

/** A futtatas/beadas eredmenypanelje a megoldo oldalon. */
export class ResultPanel {
  readonly summary: Locator
  readonly results: Locator
  readonly error: Locator

  constructor(page: Page) {
    this.summary = page.getByTestId('result-summary')
    this.results = page.getByTestId('test-result')
    this.error = page.getByTestId('result-error')
  }

  result(index: number): Locator {
    return this.results.nth(index)
  }

  /** Egy teszteset sajat (tenyleges) kimenetenek blokkja. */
  actualOutputOf(result: Locator): Locator {
    return result.getByText('A te kimeneted')
  }
}
