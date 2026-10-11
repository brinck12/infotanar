import { test as base } from '@playwright/test'
import { ApiClient } from '../api/ApiClient'
import { Outbox } from '../api/Outbox'
import { MockApi } from '../mocks/MockApi'
import { AdminExamPage } from '../pages/AdminExamPage'
import { AdminExercisePage } from '../pages/AdminExercisePage'
import { ExamPage } from '../pages/ExamPage'
import { HomePage } from '../pages/HomePage'
import { LearningPathPage } from '../pages/LearningPathPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { OralPage } from '../pages/OralPage'
import { RegisterPage } from '../pages/RegisterPage'
import { TaskListPage } from '../pages/TaskListPage'
import { TaskSolvePage } from '../pages/TaskSolvePage'
import { a11yFixtures, type A11yFixtures } from './a11y'

export interface FrameworkOptions {
  /**
   * Projektszintu opcio: mockolt-e a backend. Az "e2e-mocked" projektben
   * true; egy jovobeli, valodi backend elleni E2E projektben false.
   */
  mockBackend: boolean
}

export interface FrameworkFixtures {
  /** Route-interception alapu backend mock; `mockBackend` eseten az alap katalogussal. */
  mockApi: MockApi
  adminExamPage: AdminExamPage
  adminExercisePage: AdminExercisePage
  examPage: ExamPage
  homePage: HomePage
  onboardingPage: OnboardingPage
  oralPage: OralPage
  learningPathPage: LearningPathPage
  registerPage: RegisterPage
  taskListPage: TaskListPage
  taskSolvePage: TaskSolvePage
  /** Tipusos kliens a valodi backendhez (API tesztek). */
  apiClient: ApiClient
  /** A helyi teszt-backend altal kikuldott levelek (MAIL_MAILER=outbox). */
  outbox: Outbox
}

/**
 * A keretrendszer egyetlen belepesi pontja: a specek innen importaljak a
 * `test`-et es az `expect`-et, nem kozvetlenul a @playwright/test-bol.
 * A fixture-ok lustak: az API tesztek nem inditanak bongeszot, mert nem
 * kernek oldalt.
 */
export const test = base.extend<FrameworkFixtures & A11yFixtures & FrameworkOptions>({
  mockBackend: [false, { option: true }],

  context: async ({ context }, use) => {
    // A tarolasi tajekoztato egyszeri, a kepernyo aljan all: a tesztekben mar nyugtazottnak szamit.
    await context.addInitScript(() => {
      localStorage.setItem('infotanar.storageNotice.v1', 'true')
    })
    await use(context)
  },

  mockApi: async ({ page, mockBackend }, use) => {
    const mockApi = new MockApi(page)
    if (mockBackend) await mockApi.withCatalog()
    await use(mockApi)
  },

  // Az oldalobjektumok a mockApi-tol fuggnek, igy a mockok mar a legelso
  // navigacio elott a helyukon vannak.
  adminExamPage: async ({ page, mockApi: _ }, use) => {
    await use(new AdminExamPage(page))
  },

  adminExercisePage: async ({ page, mockApi: _ }, use) => {
    await use(new AdminExercisePage(page))
  },

  examPage: async ({ page, mockApi: _ }, use) => {
    await use(new ExamPage(page))
  },

  onboardingPage: async ({ page, mockApi: _ }, use) => {
    await use(new OnboardingPage(page))
  },

  oralPage: async ({ page, mockApi: _ }, use) => {
    await use(new OralPage(page))
  },

  homePage: async ({ page, mockApi: _ }, use) => {
    await use(new HomePage(page))
  },

  learningPathPage: async ({ page, mockApi: _ }, use) => {
    await use(new LearningPathPage(page))
  },

  registerPage: async ({ page, mockApi: _ }, use) => {
    await use(new RegisterPage(page))
  },

  taskListPage: async ({ page, mockApi: _ }, use) => {
    await use(new TaskListPage(page))
  },

  taskSolvePage: async ({ page, mockApi: _ }, use) => {
    await use(new TaskSolvePage(page))
  },

  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request))
  },

  // eslint-disable-next-line no-empty-pattern
  outbox: async ({}, use) => {
    await use(new Outbox())
  },

  ...a11yFixtures,
})

export { expect } from '@playwright/test'
export type { A11yScanOptions } from './a11y'
