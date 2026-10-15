import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** Gyakorlo vizsga: indito oldal, a futo vizsga es az eredmeny. */
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
  readonly fileInput: Locator
  readonly alert: Locator
  readonly submitButton: Locator
  readonly logoLink: Locator
  readonly leaveDialog: Locator
  readonly stayButton: Locator
  readonly closedNotice: Locator
  readonly resultTitle: Locator

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
    this.fileInput = page.getByLabel(/Fájl kiválasztása/)
    this.alert = page.getByRole('alert')
    this.submitButton = page.getByRole('button', { name: 'Beadás', exact: true })
    this.logoLink = page.getByRole('link', { name: 'InfoTanár kezdőlap' })
    this.leaveDialog = page.getByRole('dialog', { name: 'Kilépsz a vizsgából?' })
    this.stayButton = page.getByRole('button', { name: 'Maradok' })
    this.closedNotice = page.getByText('A vizsga már le van zárva')
    this.resultTitle = page.getByRole('heading', { name: 'Az eredményed' })
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

  /** Fájl kiválasztása a feltöltőben (a rejtett fájlmezőn át). */
  async chooseFile(name: string, content = 'tartalom'): Promise<void> {
    await this.fileInput.setInputFiles({ name, mimeType: 'application/octet-stream', buffer: Buffer.from(content) })
  }

  /** Igaz, ha a lap a bezáráskor megerősítést kérne (`beforeunload` megszakítható). */
  async unloadWouldWarn(): Promise<boolean> {
    return this.page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    })
  }

  /** Visszatérés a laphoz (a böngésző láthatóság-váltása): a futó vizsga újratölti a próbálkozást. */
  async returnToTab(): Promise<void> {
    await this.page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  }

  /** A részek listájának állapotjelzője (`Feltöltve` vagy `Nincs feltöltve`). */
  partStatus(label: 'Feltöltve' | 'Nincs feltöltve'): Locator {
    return this.page.getByRole('navigation', { name: 'Részek' }).getByRole('img', { name: label })
  }

  /** A vizsga számlálójának küszöbváltása (az `aria-live` régió szövege). */
  liveAnnouncement(text: RegExp): Locator {
    return this.page.getByRole('status').filter({ hasText: text })
  }
}
