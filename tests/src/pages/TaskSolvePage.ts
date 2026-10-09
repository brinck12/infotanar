import type { Locator, Page } from '@playwright/test'
import type { LanguageKey } from '../api/types'
import { BasePage } from './BasePage'
import { MonacoEditor } from './components/MonacoEditor'
import { ResultPanel } from './components/ResultPanel'

export class TaskSolvePage extends BasePage {
  readonly editor: MonacoEditor
  readonly resultPanel: ResultPanel
  readonly languageSwitch: Locator
  readonly runButton: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    super(page)
    this.editor = new MonacoEditor(page)
    this.resultPanel = new ResultPanel(page)
    this.languageSwitch = page.getByRole('group', { name: 'Programozási nyelv' })
    this.runButton = page.getByRole('button', { name: 'Futtatás' })
    this.submitButton = page.getByRole('button', { name: 'Beadás' })
  }

  /** A feladat oldala URL-je, pl. a navigacio ellenorzesehez. */
  static urlPattern(taskId: number): RegExp {
    return new RegExp(`/feladatok/${String(taskId)}$`)
  }

  heading(title: string): Locator {
    return this.page.getByRole('heading', { name: title })
  }

  /** Megnyitja a feladatot, es megvarja, hogy a szerkeszto hasznalhato legyen. */
  async open(taskId: number): Promise<void> {
    await this.navigate(`/feladatok/${String(taskId)}`)
    await this.editor.waitUntilReady()
  }

  async selectLanguage(language: LanguageKey): Promise<void> {
    await this.languageSwitch.locator(`[data-language="${language}"]`).click()
  }

  async run(): Promise<void> {
    await this.runButton.click()
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }
}
