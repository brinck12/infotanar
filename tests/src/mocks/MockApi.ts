import type { Page, Route } from '@playwright/test'
import { AdminAuthoringMock, type AdminAuthoringOptions } from './AdminAuthoringMock'
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

/** A tanulasi celok a vezetekes (snake_case) alakban. */
export interface WirePreferences {
  level: string
  exam_period: string
  language: string
  weekly_hours: string
}

export interface MockOralRow {
  topic: string
  checked: number[]
  notes: string
  scores: Record<string, number>
  attempts: number
  last_practiced_at: string | null
}

export interface MockOralPractice {
  rows: () => MockOralRow[]
  /** A PUT hivasok torzsei, sorrendben. */
  saves: () => { topic: string; body: unknown }[]
  /** A gyakorlast rogzito POST hivasok temakorei. */
  attempts: () => string[]
}

export interface MockExamOptions {
  detail?: object
  attempt?: object
  /** A probalkozas allapotvaltashoz: minden lekeresnel ujra kiertekelodik (az `attempt` helyett). */
  attemptOf?: () => object
  startError?: { status: number; body: object }
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

  /**
   * Bejelentkezett nezo: a token a helyi tarolobol jon, a /auth/me a felhasznalot adja.
   * A frontend a felhasznalo azonositojabol kepezi a helyi kulcsokat (`u<id>`).
   */
  async signIn(user: User): Promise<void> {
    await this.page.addInitScript(() => { localStorage.setItem('infotanar.token', 'pw-mock-token'); })
    await this.page.route(`${API}/auth/me`, (route) => route.fulfill({ json: { data: user } }))
  }

  /**
   * A tanulasi celok vegpontja. `null`: meg sosem mentett; `'missing'`: a vegpont nincs kint (404); `'error'`: az olvasas 500-at ad.
   * A visszaadott fuggveny az utolso PUT torzset adja (`undefined`, amig nem ment mentes).
   */
  async withPreferences(initial: WirePreferences | null | 'missing' | 'error'): Promise<() => unknown> {
    let stored: WirePreferences | null = initial === 'missing' || initial === 'error' ? null : initial
    let sent: unknown
    await this.page.route(`${API}/account/preferences`, async (route) => {
      if (initial === 'missing') return route.fulfill({ status: 404, json: { message: 'Not Found' } })
      if (initial === 'error' && route.request().method() === 'GET') return route.fulfill({ status: 500, json: { message: 'Hiba' } })
      if (route.request().method() === 'PUT') {
        sent = route.request().postDataJSON() as unknown
        stored = sent as WirePreferences
      }
      return route.fulfill({ json: { data: stored } })
    })
    return () => sent
  }

  /**
   * A szobeli gyakorlas vegpontjai. `'missing'`: a vegpontok nincsenek kint (404).
   * A visszaadott objektum a sorokat, az utolso mentest es a gyakorlasok szamlalasat adja.
   */
  async withOralPractice(initial: MockOralRow[] | 'missing' | 'error'): Promise<MockOralPractice> {
    const rows: MockOralRow[] = typeof initial === 'string' ? [] : [...initial]
    const saves: { topic: string; body: unknown }[] = []
    const attempts: string[] = []
    const missing = (route: Route) => route.fulfill({ status: 404, json: { message: 'Not Found' } })
    const topicOf = (route: Route) => new URL(route.request().url()).pathname.split('/').filter(Boolean)[4] ?? ''
    const upsert = (topic: string, patch: Partial<MockOralRow>): MockOralRow => {
      const index = rows.findIndex((row) => row.topic === topic)
      const row: MockOralRow = {
        ...(rows[index] ?? { topic, checked: [], notes: '', scores: {}, attempts: 0, last_practiced_at: null }),
        ...patch,
      }
      if (index === -1) rows.push(row)
      else rows[index] = row
      return row
    }

    await this.page.route(`${API}/oral/practice`, (route) => {
      if (initial === 'error') return route.fulfill({ status: 500, json: { message: 'Hiba' } })
      return initial === 'missing' ? missing(route) : route.fulfill({ json: { data: rows } })
    })
    await this.page.route(`${API}/oral/practice/*`, (route) => {
      if (initial === 'missing') return missing(route)
      const topic = topicOf(route)
      const body = route.request().postDataJSON() as Partial<MockOralRow>
      saves.push({ topic, body })
      return route.fulfill({ json: { data: upsert(topic, body) } })
    })
    await this.page.route(`${API}/oral/practice/*/attempts`, (route) => {
      if (initial === 'missing') return missing(route)
      const topic = topicOf(route)
      attempts.push(topic)
      const current = rows.find((row) => row.topic === topic)
      return route.fulfill({ json: { data: upsert(topic, { attempts: (current?.attempts ?? 0) + 1 }) } })
    })

    return { rows: () => rows, saves: () => saves, attempts: () => attempts }
  }

  /** Gyakorlo vizsgak: lista, egy feladatsor, egy probalkozas. A `startError` az indito POST hibaja. */
  async withExams(exams: object[], options: MockExamOptions = {}): Promise<void> {
    await this.page.route(`${API}/exams`, (route) => route.fulfill({ json: { data: exams } }))
    if (options.detail) await this.page.route(`${API}/exams/*`, (route) => route.fulfill({ json: { data: options.detail } }))
    const { attempt, attemptOf } = options
    if (attempt ?? attemptOf) {
      await this.page.route(`${API}/exam-attempts/*`, (route) => route.fulfill({ json: { data: attemptOf ? attemptOf() : attempt } }))
    }
    if (options.startError) {
      const { status, body } = options.startError
      await this.page.route(`${API}/exams/*/attempts`, (route) => route.fulfill({ status, json: body }))
    }
  }

  /** A belepett nezonek nincs elofizetese. */
  async withoutSubscription(): Promise<void> {
    await this.page.route(`${API}/billing/subscription`, (route) => route.fulfill({ json: { data: null } }))
  }

  /** A kijelentkezes vegpontja. */
  async onLogout(): Promise<void> {
    await this.page.route(`${API}/auth/logout`, (route) => route.fulfill({ status: 204 }))
  }

  /** A vizsga eredmenyoldalanak adata. */
  async withExamResult(result: object): Promise<void> {
    await this.page.route(`${API}/exam-attempts/*/result`, (route) => route.fulfill({ json: { data: result } }))
  }

  /** A vizsgareszhez feltoltes valasza; a visszaadott fuggveny a kuldott keresek szamat adja. */
  async onExamPartUpload(response: { status: number; body: object }): Promise<() => number> {
    let calls = 0
    await this.page.route(`${API}/exam-attempts/*/parts/*/file`, (route) => {
      calls += 1
      return route.fulfill({ status: response.status, json: response.body })
    })
    return () => calls
  }

  /**
   * A vizsga beadasa: a `respond` a hivas sorszamat (1-tol) kapja, es a valaszt adja.
   * A visszaadott fuggveny a kuldott keresek szamat adja.
   */
  async onExamSubmit(respond: (call: number) => { status: number; body: object }): Promise<() => number> {
    let calls = 0
    await this.page.route(`${API}/exam-attempts/*/submit`, (route) => {
      calls += 1
      const { status, body } = respond(calls)
      return route.fulfill({ status, json: body })
    })
    return () => calls
  }

  /** Egy fajlfeladat beadasai (lista es egyedi lekeres). */
  async withFileTask(submissions: { id: number }[]): Promise<void> {
    await this.page.route(`${API}/exercises/*/file-submissions`, (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      return route.fulfill({ json: { data: submissions } })
    })
    await this.page.route(`${API}/file-submissions/*`, (route) => {
      const id = Number(new URL(route.request().url()).pathname.split('/').pop())
      const found = submissions.find((item) => item.id === id)
      return found ? route.fulfill({ json: { data: found } }) : route.fulfill({ status: 404, json: { message: 'Not Found' } })
    })
  }

  /** A fajlfeltoltes valasza; a visszaadott fuggveny a feltoltesek szamat adja. */
  async onFileUpload(body: object, { status = 201 }: MockResponseOptions = {}): Promise<() => number> {
    let uploads = 0
    await this.page.route(`${API}/exercises/*/file-submissions`, (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      uploads += 1
      return route.fulfill({ status, json: { data: body } })
    })
    return () => uploads
  }

  /**
   * Az admin szerkeszto vegpontjai (feladat, csatolmanyok, ertekelolap, vizsga) allapottal.
   * A visszaadott objektum a kuldott hivasokat adja.
   */
  async withAdminAuthoring(options: AdminAuthoringOptions = {}): Promise<AdminAuthoringMock> {
    const mock = new AdminAuthoringMock(this.page, options)
    await mock.install()
    return mock
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
