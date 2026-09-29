import type { PlaywrightTestConfig } from '@playwright/test'
import { env } from './env'

type WebServer = NonNullable<Extract<PlaywrightTestConfig['webServer'], unknown[]>>[number]

/** Melyik projektcsoport melyik helyi szervert igenyli. */
export type ServerGroup = 'frontend' | 'backend'

const FRONTEND_URL = new URL(env.BASE_URL)
const API_URL = new URL(env.API_BASE_URL)
const JUDGE0_URL = `http://127.0.0.1:${env.JUDGE0_MOCK_PORT}`

/** A buildelt frontendet szolgaljuk ki: ugyanaz fut, mint ami deployolodik. */
const frontend: WebServer = {
  command: `npm --prefix ../frontend run build && npm --prefix ../frontend run preview -- --host ${FRONTEND_URL.hostname} --port ${FRONTEND_URL.port} --strictPort`,
  url: env.BASE_URL,
  reuseExistingServer: !env.CI,
  timeout: 120_000,
}

/** Minimalis Judge0-hasonmas a backend kodfuttato hivasaihoz (src/mocks/judge0). */
const judge0Mock: WebServer = {
  command: 'npx tsx src/mocks/judge0/server.ts',
  url: `${JUDGE0_URL}/about`,
  reuseExistingServer: !env.CI,
  timeout: 30_000,
  env: { JUDGE0_MOCK_PORT: String(env.JUDGE0_MOCK_PORT) },
}

/**
 * Valodi Laravel backend sqlite fixture adatbazissal
 * (backend/database/seeders/ApiTestSeeder.php).
 *
 * "php artisan serve" egy kulon gyerekfolyamatkent inditja a valodi PHP
 * szervert - Windows alatt ezt a Playwright nem tudja megbizhatoan
 * leallitani, es egy elszabadult szerver a kovetkezo futtatasnal
 * regi/hianyzo adatbazissal valaszol. Ezert kozvetlenul a beepitett PHP
 * szervert inditjuk, ugyanugy, ahogy a "serve" parancs is tenne.
 */
const backend: WebServer = {
  command: `php artisan test:prepare-api-fixtures && cd public && php -S ${API_URL.host} ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php`,
  cwd: '../backend',
  url: new URL('health', API_URL).toString(),
  // Sosem hasznalunk ujra korabbi peldanyt: a fixture-oknek minden
  // futtataskor frissen kell letrejonniuk, kulonben csendben elavult
  // allapotot tesztelnenk.
  reuseExistingServer: false,
  timeout: 60_000,
  env: {
    APP_ENV: 'testing',
    // Csak a helyi, eldobhato teszt-backendhez; nem titok.
    APP_KEY: 'base64:IuoO2O2E2ePTfNKZ3XNlVF5ZfvMJM5zld0sDIFlKhQ8=',
    APP_DEBUG: 'true',
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: 'database/testing.sqlite',
    SESSION_DRIVER: 'array',
    // Nem "array": a beepitett PHP szerver kerelmenkent uj folyamatban
    // fut, egy in-memory cache nem elne tul egy kerelmet, es a rate-limit
    // teszt sosem latna a szamlalot novekedni.
    CACHE_STORE: 'file',
    QUEUE_CONNECTION: 'sync',
    BROADCAST_CONNECTION: 'log',
    MAIL_MAILER: 'array',
    JUDGE0_URL,
  },
}

const SERVERS: Record<ServerGroup, WebServer[]> = {
  frontend: [frontend],
  backend: [judge0Mock, backend],
}

/**
 * A Playwright a webServer listat projekttol fuggetlenul, mindig
 * egeszben inditja. Hogy `--project=e2e-mocked` ne igenyeljen PHP-t (es
 * forditva), a parancssorbol kiolvassuk a kivalasztott projekteket, es
 * csak az azokhoz tartozo szervereket inditjuk. Projekt megadasa nelkul
 * minden szerver elindul.
 */
export function webServersFor(projectServers: Record<string, ServerGroup>): WebServer[] {
  if (!env.START_WEB_SERVERS) return []

  const selected = selectedProjects()
  const groups = new Set<ServerGroup>(
    Object.entries(projectServers)
      .filter(([project]) => selected.length === 0 || selected.some((pattern) => matches(pattern, project)))
      .map(([, group]) => group)
  )

  return [...groups].flatMap((group) => SERVERS[group])
}

/** A Playwright-tal egyezoen: kis-nagybetu fuggetlen, `*` helyettesito karakterrel. */
function matches(pattern: string, project: string): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')
  return new RegExp(`^${escaped}$`, 'i').test(project)
}

function selectedProjects(): string[] {
  const args = process.argv
  const projects: string[] = []
  args.forEach((arg, index) => {
    if (arg === '--project') {
      const next = args[index + 1]
      if (next) projects.push(next)
    } else if (arg.startsWith('--project=')) {
      projects.push(arg.slice('--project='.length))
    }
  })
  return projects
}
