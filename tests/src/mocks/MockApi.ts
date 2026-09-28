import type { Page, Route } from '@playwright/test'
import type { RunResponse, SubmissionResponse, TaskDetail, Topic } from '../api/types'
import { buildTaskDetail, buildTopic, toTaskListItem } from '../data/builders/catalog'

/** Az app a relativ /api/v1 utvonalat hivja, barmelyik hoston fusson. */
const API = '**/api/v1'

export interface MockCatalog {
  topics: Topic[]
  tasks: TaskDetail[]
}

export interface MockResponseOptions {
  status?: number
}

/**
 * A backend mockolasa route interceptionnel, hogy az E2E tesztek elo
 * backend es Judge0 nelkul, determinisztikusan fussanak.
 *
 * A kesobb regisztralt route elsobbseget elvez, ezert egy teszt a
 * `withCatalog`, `onRun` vagy `onSubmit` hivassal barmikor felulirhatja
 * az alapertelmezett valaszokat.
 */
export class MockApi {
  constructor(private readonly page: Page) {}

  /** Alapertelmezett katalogus: egy temakor, benne egy feladat. */
  static defaultCatalog(): MockCatalog {
    return { topics: [buildTopic()], tasks: [buildTaskDetail()] }
  }

  /** Az olvaso vegpontok (temakorok, feladatlista, feladat reszletei) mockolasa. */
  async withCatalog(catalog: MockCatalog = MockApi.defaultCatalog()): Promise<void> {
    const list = { data: catalog.tasks.map(toTaskListItem) }

    await this.page.route(`${API}/topics`, (route) => route.fulfill({ json: { data: catalog.topics } }))
    // A lista a query stringtol (szures) fuggetlenul ugyanazt adja.
    await this.page.route(`${API}/tasks?*`, (route) => route.fulfill({ json: list }))
    await this.page.route(`${API}/tasks`, (route) => route.fulfill({ json: list }))
    await this.page.route(`${API}/tasks/*`, (route) => this.fulfillTask(route, catalog.tasks))
  }

  /** A /run valasza. */
  async onRun(body: RunResponse, { status = 200 }: MockResponseOptions = {}): Promise<void> {
    await this.page.route(`${API}/run`, (route) => route.fulfill({ status, json: body }))
  }

  /** A /submissions valasza. */
  async onSubmit(body: SubmissionResponse | RunResponse, { status = 200 }: MockResponseOptions = {}): Promise<void> {
    await this.page.route(`${API}/submissions`, (route) => route.fulfill({ status, json: body }))
  }

  private async fulfillTask(route: Route, tasks: TaskDetail[]): Promise<void> {
    const id = Number(new URL(route.request().url()).pathname.split('/').pop())
    const task = tasks.find((t) => t.id === id)
    if (task) {
      await route.fulfill({ json: { data: task } })
    } else {
      await route.fulfill({ status: 404, json: { message: 'Not Found' } })
    }
  }
}
