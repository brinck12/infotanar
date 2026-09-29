import { expect, type Locator, type Page } from '@playwright/test'

/**
 * A Monaco kodszerkeszto komponens. A Monaco lassan, aszinkron toltodik
 * (kulon loader + worker), ezert a keszenletre sajat, hosszabb timeouttal
 * varunk, nem a globalis expect timeouttal.
 */
export class MonacoEditor {
  static readonly READY_TIMEOUT = 20_000

  readonly root: Locator

  constructor(page: Page) {
    this.root = page.locator('.monaco-editor').first()
  }

  async waitUntilReady(): Promise<void> {
    await expect(this.root, 'a Monaco szerkeszto betoltodik').toBeVisible({ timeout: MonacoEditor.READY_TIMEOUT })
  }
}
