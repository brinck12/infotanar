import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** Admin: feladat szerkesztese (tipus, tipus-adatok, fajlok, ertekelolap). */
export class AdminExercisePage extends BasePage {
  readonly kind: Locator
  readonly title: Locator
  readonly save: Locator
  readonly published: Locator
  readonly saved: Locator
  readonly steps: Locator
  readonly deliverable: Locator
  readonly software: Locator
  readonly examPoints: Locator
  readonly specJson: Locator
  readonly insertSample: Locator
  readonly attachmentRole: Locator
  readonly attachmentFile: Locator
  readonly attachmentTestCase: Locator
  readonly uploadAttachment: Locator
  readonly attachmentList: Locator
  readonly rubricLabel: Locator
  readonly rubricGroup: Locator
  readonly rubricCheckType: Locator
  readonly rubricProperty: Locator
  readonly rubricExpected: Locator
  readonly rubricPoints: Locator
  readonly addRubricItem: Locator
  readonly saveRubricItem: Locator
  readonly tryRubric: Locator
  readonly tryResult: Locator
  readonly rubricUnavailable: Locator

  constructor(page: Page) {
    super(page)
    this.kind = page.getByLabel('Típus', { exact: true })
    this.title = page.getByLabel('Cím', { exact: true })
    this.save = page.getByRole('button', { name: /^(Mentés|Feladat létrehozása)$/ })
    this.published = page.getByRole('switch', { name: 'Közzétéve' })
    this.saved = page.getByText('Mentve')
    this.steps = page.getByLabel('Teendők (soronként egy lépés)')
    this.deliverable = page.getByLabel('Beadandó fájl neve')
    this.software = page.getByLabel('Használható programok')
    this.examPoints = page.getByLabel('Vizsgapont')
    this.specJson = page.getByLabel('A feladat adatai (JSON)')
    this.insertSample = page.getByRole('button', { name: 'Minta beillesztése' })
    this.attachmentRole = page.getByLabel('A fájl szerepe')
    this.attachmentTestCase = page.getByLabel('Melyik teszteset')
    this.attachmentFile = page.getByLabel('Fájl', { exact: true })
    this.uploadAttachment = page.getByRole('button', { name: 'Fájl feltöltése' })
    this.attachmentList = page.getByRole('table', { name: 'A feladat csatolt fájljai' })
    this.rubricLabel = page.getByLabel('Megnevezés')
    this.rubricGroup = page.getByLabel('Csoport', { exact: true })
    this.rubricCheckType = page.getByLabel('Mit vizsgáljunk?')
    this.rubricProperty = page.getByLabel('Tulajdonság')
    this.rubricExpected = page.getByLabel('Elvárt érték')
    this.rubricPoints = page.getByLabel('Pont', { exact: true })
    this.addRubricItem = page.getByRole('button', { name: 'Pont hozzáadása' })
    this.saveRubricItem = page.getByRole('button', { name: 'Pont mentése' })
    this.tryRubric = page.getByRole('button', { name: 'Kipróbálás mintamegoldással' })
    this.tryResult = page.getByTestId('rubric-check-result')
    this.rubricUnavailable = page.getByText('Az értékelőlap a szerveren még nincs bekapcsolva')
  }

  async gotoNew(lessonId: number): Promise<void> {
    await this.navigate(`/admin/tananyag/leckek/${lessonId}/uj-feladat`)
  }

  async gotoExisting(exerciseId: number): Promise<void> {
    await this.navigate(`/admin/tananyag/feladatok/${exerciseId}`)
  }

  tab(name: string): Locator {
    return this.page.getByRole('tab', { name })
  }

  extension(extension: string): Locator {
    return this.page.getByRole('checkbox', { name: extension })
  }

  checkTypeOption(name: string): Locator {
    return this.rubricCheckType.getByRole('option', { name, exact: true })
  }

  rubricRow(label: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(label) })
  }

  async fillBasics(title: string): Promise<void> {
    await this.title.fill(title)
  }

  roleOption(name: string): Locator {
    return this.attachmentRole.getByRole('option', { name })
  }

  async attach(role: string, name: string, content: string): Promise<void> {
    await this.attachmentRole.selectOption({ label: role })
    await this.attachmentFile.setInputFiles({ name, mimeType: 'application/octet-stream', buffer: Buffer.from(content) })
    await this.uploadAttachment.click()
  }

  async addRubric(label: string, group: string, property: string, expected: string, points: number): Promise<void> {
    await this.rubricLabel.fill(label)
    await this.rubricGroup.fill(group)
    await this.rubricProperty.fill(property)
    await this.rubricExpected.fill(expected)
    await this.rubricPoints.fill(String(points))
    await this.addRubricItem.click()
  }
}
