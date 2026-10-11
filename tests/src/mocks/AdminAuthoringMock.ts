import type { Page, Route } from '@playwright/test'

const API = '**/api/v1'

type Json = Record<string, unknown>

/** Egy admin hivas: modszer, a /api/v1 utani utvonal es a torzs (JSON, multipartnal a nyers szoveg). */
export interface AdminCall {
  method: string
  path: string
  body: Json | null
  raw: string
}

export interface AdminAuthoringOptions {
  /** `false`: az ertekelolap-vegpontok nincsenek kint (404), mint a WP3 merge elott. */
  rubricAvailable?: boolean
  /** A feladat mentesenek egymas utani elutasitasai (422, a `spec` mezon); ha elfogy, a mentes sikerul. */
  specErrors?: string[]
}

interface Stored {
  id: number
  name: string
  size: number
  role?: string
  test_case_id?: number | null
}

/**
 * Az admin szerkeszto vegpontjai allapottal: egy lecke, egy (uj) feladat a
 * csatolmanyaival es ertekelolapjaval, es egy gyakorlo vizsga a forras zippel.
 * Minden hivast elmentunk, hogy a teszt a kuldott torzseket vizsgalhassa.
 */
export class AdminAuthoringMock {
  readonly calls: AdminCall[] = []
  private exercise: Json | null = null
  private attachments: Stored[] = []
  private rubric: Json[] = []
  private exam: Json = {
    id: 7,
    session: '2026-05',
    title: 'Gyakorló vizsga',
    level: 'kozep',
    minutes: 180,
    points: 100,
    is_published: false,
    timed_mode: true,
    parts: [],
    files: [],
  }
  private nextId = 100
  private readonly specErrors: string[]
  private readonly rubricAvailable: boolean

  constructor(
    private readonly page: Page,
    options: AdminAuthoringOptions = {},
  ) {
    this.rubricAvailable = options.rubricAvailable ?? true
    this.specErrors = [...(options.specErrors ?? [])]
  }

  /** Az utolso, a megadott modszerrel es utvonallal erkezett hivas torzse. */
  lastBody(method: string, path: string): Json | null {
    return this.calls.filter((call) => call.method === method && call.path === path).at(-1)?.body ?? null
  }

  async install(): Promise<void> {
    await this.page.route(`${API}/languages`, (route) =>
      route.fulfill({ json: { data: [{ key: 'python', label: 'Python', monaco: 'python', default_limits: { time_limit_ms: 2000, memory_limit_kb: 128000 }, time_factor: 1 }] } }),
    )
    await this.page.route(`${API}/admin/**`, (route) => this.handle(route))
  }

  private async handle(route: Route): Promise<void> {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname.replace(/^.*\/api\/v1/, '')
    const raw = request.postData() ?? ''
    const isJson = (request.headers()['content-type'] ?? '').includes('json')
    const body = isJson && raw !== '' ? (JSON.parse(raw) as Json) : null
    this.calls.push({ method, path, body, raw })

    const ok = (data: unknown, status = 200) => route.fulfill({ status, json: { data } })
    const missing = () => route.fulfill({ status: 404, json: { message: 'Not Found' } })
    const idOf = (segment: string): number => Number(segment)

    if (path === '/admin/lessons/1' && method === 'GET') {
      return ok({ id: 1, module_id: 1, slug: 'lecke', title: 'Táblázatkezelés', content: null, video_path: null, captions_path: null, position: 1, is_free: false, is_published: true })
    }

    // Feladat
    if (path === '/admin/exercises' && method === 'POST') {
      const specError = this.specErrors.shift()
      if (specError) return route.fulfill({ status: 422, json: { message: specError, errors: { spec: [specError] } } })
      this.exercise = this.build(body ?? {})
      return ok(this.exercise, 201)
    }
    const exercise = /^\/admin\/exercises\/(\d+)$/.exec(path)
    if (exercise && this.exercise?.id === idOf(exercise[1] ?? '')) {
      if (method === 'GET') return ok(this.view())
      if (method === 'PUT') {
        const specError = this.specErrors.shift()
        if (specError) return route.fulfill({ status: 422, json: { message: specError, errors: { spec: [specError] } } })
        this.exercise = { ...this.exercise, ...(body ?? {}) }
        return ok(this.view())
      }
    }
    if (/^\/admin\/exercises\/\d+\/test-cases$/.test(path)) return ok([])

    // Csatolmanyok
    if (/^\/admin\/exercises\/\d+\/attachments$/.test(path)) {
      if (method === 'GET') return ok(this.attachments.map((item) => this.attachmentView(item)))
      const stored = this.storeUpload(raw)
      this.attachments.push(stored)
      return ok(this.attachmentView(stored), 201)
    }
    const attachment = /^\/admin\/attachments\/(\d+)$/.exec(path)
    if (attachment && method === 'DELETE') {
      const id = idOf(attachment[1] ?? '')
      this.attachments = this.attachments.filter((item) => item.id !== id)
      this.exam = { ...this.exam, files: (this.exam.files as Stored[]).filter((item) => item.id !== id) }
      return route.fulfill({ status: 204 })
    }

    // Ertekelolap
    if (path.includes('/rubric')) {
      if (!this.rubricAvailable) return missing()
      if (/^\/admin\/exercises\/\d+\/rubric-items$/.test(path)) {
        if (method === 'GET') return ok(this.rubric)
        const item = { id: this.nextId++, exercise_id: 100, position: this.rubric.length + 1, ...(body ?? {}) }
        this.rubric.push(item)
        return ok(item, 201)
      }
      const rubricItem = /^\/admin\/rubric-items\/(\d+)$/.exec(path)
      if (rubricItem && method === 'PUT') {
        const id = idOf(rubricItem[1] ?? '')
        this.rubric = this.rubric.map((item) => (item.id === id ? { ...item, ...(body ?? {}) } : item))
        return ok(this.rubric.find((item) => item.id === id))
      }
      if (/^\/admin\/exercises\/\d+\/rubric-check$/.test(path)) return ok(this.checkResult())
    }

    // Vizsga
    if (path === '/admin/exams' && method === 'GET') return ok([this.exam])
    if (path === '/admin/exams/7') {
      if (method === 'GET') return ok(this.exam)
      if (method === 'PUT') {
        this.exam = { ...this.exam, ...(body ?? {}) }
        return ok(this.exam)
      }
    }
    if (path === '/admin/exams/7/attachments' && method === 'POST') {
      const stored = this.storeUpload(raw)
      this.exam = { ...this.exam, files: [{ id: stored.id, name: stored.name, size: stored.size, url: `/download/${stored.id}` }] }
      return ok(this.exam.files, 201)
    }

    return missing()
  }

  private build(body: Json): Json {
    return { id: 100, lesson_id: 1, position: 1, submission_count: 0, rubric_item_count: 0, attachments: [], ...body }
  }

  private view(): Json {
    return { ...this.exercise, rubric_item_count: this.rubric.length }
  }

  private storeUpload(raw: string): Stored {
    const field = (name: string): string | null => new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`).exec(raw)?.[1] ?? null
    const filename = /filename="([^"]*)"/.exec(raw)?.[1] ?? 'fajl'
    const testCase = field('test_case_id')
    return {
      id: this.nextId++,
      name: field('name') ?? filename,
      size: 1024,
      role: field('role') ?? 'source_zip',
      test_case_id: testCase === null ? null : Number(testCase),
    }
  }

  private attachmentView(item: Stored): Json {
    return { id: item.id, role: item.role ?? 'source', name: item.name, size: item.size, test_case_id: item.test_case_id ?? null, url: `/download/${item.id}` }
  }

  private checkResult(): Json {
    const items = this.rubric.map((item) => ({
      rubric_item_id: item.id,
      label: item.label,
      state: 'ok',
      points: item.points,
      max_points: item.points,
      found: null,
      hint: null,
      manual_mark: null,
    }))
    const total = this.rubric.reduce((sum, item) => sum + Number(item.points), 0)
    return { status: 'evaluated', score: total, max_score: total, groups: [], items, facts: [], error: null }
  }
}
