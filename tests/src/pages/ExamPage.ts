import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** Gyakorlo vizsga: indito oldal es a futo vizsga. */
export class ExamPage extends BasePage {
  readonly startButton: Locator
  readonly timer: Locator
  readonly premiumLink: Locator
  readonly lockBanner: Locator
  readonly runningBanner: Locator
  readonly modeMismatch: Locator
  readonly practiceMode: Locator
  readonly examStrip: Locator
  readonly solvedVerdict: Locator
  readonly attemptMode: Locator

  constructor(page: Page) {
    super(page)
    this.startButton = page.getByRole('button', { name: 'Indítás' })
    this.timer = page.getByRole('timer')
    this.premiumLink = page.getByRole('link', { name: 'Prémium előfizetés' })
    this.lockBanner = page.getByTestId('exam-lock')
    this.runningBanner = page.getByTestId('running-attempt')
    this.modeMismatch = page.getByTestId('mode-mismatch')
    this.practiceMode = page.getByRole('radio', { name: /Gyakorlás időkorlát nélkül/ })
    this.examStrip = page.getByTestId('exam-strip')
    this.solvedVerdict = page.getByTestId('solved-verdict')
    this.attemptMode = page.getByTestId('attempt-mode')
  }

  async gotoStart(examId: number): Promise<void> {
    await this.navigate(`/vizsgak/${examId}`)
  }

  async gotoRunner(examId: number, attemptId: number): Promise<void> {
    await this.navigate(`/vizsgak/${examId}/fut?proba=${attemptId}`)
  }

  async gotoResult(examId: number, attemptId: number): Promise<void> {
    await this.navigate(`/vizsgak/${examId}/eredmeny?proba=${attemptId}`)
  }

  async gotoList(): Promise<void> {
    await this.navigate('/vizsgak')
  }

  /** A szerkesztoben megoldando feladat, a vizsgabol megnyitva. */
  async gotoTaskFromExam(taskId: number, examId: number, attemptId: number): Promise<void> {
    await this.navigate(`/feladatok/${taskId}?vizsga=${examId}&proba=${attemptId}`)
  }
}
