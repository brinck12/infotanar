import { test as base } from '@playwright/test'
import { env } from '../../config/env'
import { ApiClient } from '../api/ApiClient'
import { MockApi } from '../mocks/MockApi'
import { serveMonacoLocally } from '../mocks/monaco'
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
  taskListPage: TaskListPage
  taskSolvePage: TaskSolvePage
  /** Tipusos kliens a valodi backendhez (API tesztek). */
  apiClient: ApiClient
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
    if (env.MONACO_SOURCE === 'local') await serveMonacoLocally(context)
    await use(context)
  },

  mockApi: async ({ page, mockBackend }, use) => {
    const mockApi = new MockApi(page)
    if (mockBackend) await mockApi.withCatalog()
    await use(mockApi)
  },

  // Az oldalobjektumok a mockApi-tol fuggnek, igy a mockok mar a legelso
  // navigacio elott a helyukon vannak.
  taskListPage: async ({ page, mockApi: _ }, use) => {
    await use(new TaskListPage(page))
  },

  taskSolvePage: async ({ page, mockApi: _ }, use) => {
    await use(new TaskSolvePage(page))
  },

  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request))
  },

  ...a11yFixtures,
})

export { expect } from '@playwright/test'
export type { A11yScanOptions } from './a11y'
