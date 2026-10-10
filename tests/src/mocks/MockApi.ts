import type { Page, Route } from '@playwright/test'
import type { RunResponse, SubmissionResponse, TaskDetail, Topic, User } from '../api/types'
import { buildTaskDetail, buildTopic, buildTrackDetail, toLessonDetail, toTaskListItem, toTrackSummary } from '../data/builders/catalog'

/** Az app a relativ /api/v1 utvonalat hivja, barmelyik hoston fusson. */
const API = '**/api/v1'

export interface MockCatalog {
  topics: Topic[]
  tasks: TaskDetail[]
}

export interface MockResponseOptions {
  status?: number
}

/** A futtatasi korlat valasza (429 / 503): mennyit kell varni, es miert. */
export interface MockExecutionWait {
  reason: 'rate_limited' | 'busy'
  retry_after: number
  guest?: boolean
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

  /** Az olvaso vegpontok (temakorok, kepzesi agak, leckek, feladatlista, feladat reszletei) mockolasa. */
  async withCatalog(catalog: MockCatalog = MockApi.defaultCatalog()): Promise<void> {
    const list = { data: catalog.tasks.map(toTaskListItem) }

    const track = buildTrackDetail(catalog.tasks)

    await this.page.route(`${API}/topics`, (route) => route.fulfill({ json: { data: catalog.topics } }))
    await this.page.route(`${API}/tracks`, (route) => route.fulfill({ json: { data: [toTrackSummary(track)] } }))
    await this.page.route(`${API}/tracks/*`, (route) => route.fulfill({ json: { data: track } }))
    await this.page.route(`${API}/tracks/*/lessons/*`, (route) => {
      const lesson = toLessonDetail(track, decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1) ?? ''))
      return lesson ? route.fulfill({ json: { data: lesson } }) : route.fulfill({ status: 404, json: { message: 'Not Found' } })
    })
    await this.page.route(`${API}/billing/plan`, (route) =>
      route.fulfill({ json: { data: { name: 'InfoTanár Prémium', price_huf: 2990, period_months: 1 } } })
    )
    // A lista a query stringtol (szures) fuggetlenul ugyanazt adja.
    await this.page.route(`${API}/tasks?*`, (route) => route.fulfill({ json: list }))
    await this.page.route(`${API}/tasks`, (route) => route.fulfill({ json: list }))
    await this.page.route(`${API}/tasks/*`, (route) => this.fulfillTask(route, catalog.tasks))
  }

  /** A /run valasza. */
  async onRun(body: RunResponse, { status = 200 }: MockResponseOptions = {}): Promise<void> {
    await this.page.route(`${API}/run`, (route) => route.fulfill({ status, json: body }))
  }

  /** A /run a futtatasi korlatba utkozik (#148). */
  async onRunLimited(wait: MockExecutionWait): Promise<void> {
    const status = wait.reason === 'busy' ? 503 : 429
    await this.page.route(`${API}/run`, (route) =>
      route.fulfill({ status, json: { message: 'Túl sok futtatás rövid idő alatt.', ...wait } })
    )
  }

  /**
   * A regisztracio es az azt koveto belepes. A visszaadott fuggveny a
   * regisztraciokor elkuldott torzset adja (`undefined`, amig nem ment keres).
   */
  async onRegister(user: User): Promise<() => unknown> {
    let sent: unknown
    await this.page.route(`${API}/auth/register`, async (route) => {
      sent = route.request().postDataJSON() as unknown
      await route.fulfill({ status: 201, json: { data: user } })
    })
    await this.page.route(`${API}/auth/login`, (route) =>
      route.fulfill({ json: { data: { token: 'pw-mock-token', token_type: 'Bearer', user } } })
    )
    await this.page.route(`${API}/auth/me`, (route) => route.fulfill({ json: { data: user } }))

    return () => sent
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
