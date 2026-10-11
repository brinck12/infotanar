import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * A `php artisan filetasks:evaluate` parancs tesztsegedje: olyan fajlokat is
 * kiertekel az ertekelolap-vizsgalatokkal, amelyeket semmilyen feladatfajta nem
 * fogad feltoltesre (html, css), es hostile bemenetek ido- es hibaviselkedeset
 * is megmutatja. A parancs a teszt-backend fixture adatbazisat olvassa (a 5.
 * feladat csak hordozo: az `--item` kapcsolok a tarolt ertekelolap helyett futnak).
 *
 * Az adatbazis a `test:prepare-api-fixtures` utan all; a parancs semmit nem ment.
 */

export interface CliCase {
  type: string
  property: string
  expected: string
}

export interface CliItem {
  state: string
  found: string | null
}

export interface CliResult {
  status: string
  error: string | null
  items: CliItem[]
  facts: { label: string; value: string }[]
  /** A parancs faliora-ideje, ms. */
  elapsedMs: number
}

const BACKEND = path.resolve(__dirname, '../../../backend')
/** A hordozo feladat (a seedelt tablazatos feladat); a fajtaja nem szamit. */
const CARRIER_EXERCISE = 5

/** A tartalmat ideiglenes fajlba irja, lefuttatja a vizsgalatokat, majd torli a fajlt. */
export function evaluateWithCli(name: string, contents: Buffer | string, cases: CliCase[]): CliResult {
  const directory = mkdtempSync(path.join(tmpdir(), 'infotanar-cli-'))
  const file = path.join(directory, name)
  writeFileSync(file, contents)

  try {
    const started = Date.now()
    const output = execFileSync(
      'php',
      ['artisan', 'filetasks:evaluate', String(CARRIER_EXERCISE), file, ...cases.map((item) => `--item=${item.type}|${item.property}|${item.expected}`)],
      {
        cwd: BACKEND,
        env: {
          ...process.env,
          APP_ENV: 'testing',
          DB_CONNECTION: 'sqlite',
          DB_DATABASE: path.join(BACKEND, 'database', 'testing.sqlite'),
        },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 16 * 1024 * 1024,
      }
    )

    const parsed = JSON.parse(output) as Omit<CliResult, 'elapsedMs'>

    return { ...parsed, elapsedMs: Date.now() - started }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}
