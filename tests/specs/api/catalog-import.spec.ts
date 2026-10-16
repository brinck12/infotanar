import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { expect, test } from '../../src/fixtures'
import { artisanResult, tinkerJson } from '../../src/support/artisan'

const FIXTURES = path.resolve(__dirname, '../../fixtures/catalog')
const VALID = path.join(FIXTURES, 'valid')
const INVALID = path.join(FIXTURES, 'invalid')
const LESSON_DIR = 'pw-import-track/01-pw-import-modul/01-pw-import-lecke'
const MODULE_DIR = 'pw-import-track/01-pw-import-modul'

function dryRun(root: string): ReturnType<typeof artisanResult> {
  return artisanResult(['catalog:import', '--dry-run', `--path=${root}`])
}

/** A torzs hossza: a fejlec lezaro `---` sora utani szoveg, szo szerint. */
function bodyLength(markdown: string): number {
  const normalized = (markdown.startsWith('﻿') ? markdown.slice(1) : markdown).replace(/\r\n/g, '\n')
  const end = normalized.indexOf('\n---\n', 3)
  return normalized.slice(end + 5).length
}

function reportedLength(stdout: string): number {
  const match = /törzs: (\d+) karakter/.exec(stdout)
  if (!match?.[1]) throw new Error(`Nincs torzs-hossz a kimenetben: ${stdout}`)

  return Number(match[1])
}

test.describe('catalog:import --dry-run @regression', () => {
  test('a valid fa hibatlanul beolvasodik, es nem ir az adatbazisba', () => {
    const result = dryRun(VALID)

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain('1 új lecke')
    expect(result.stdout).toContain('2 új feladat')

    const created = tinkerJson("return App\\Models\\Track::query()->where('slug', 'like', 'pw-import-%')->count();")
    expect(created).toBe(0)
  })

  test('az invalid fa hibait fajlonkent, magyar uzenettel listazza', () => {
    const result = dryRun(INVALID)
    const output = result.stdout + result.stderr

    expect(result.status).toBe(1)
    // ismeretlen fejlecmezo
    expect(output).toContain(`${MODULE_DIR}/01-elgepelt/lesson.md`)
    expect(output).toContain('Ismeretlen kulcs: „publised”')
    // ekezetes slug
    expect(output).toContain(`${MODULE_DIR}/02-ekezetes/lesson.md`)
    expect(output).toContain('csak kisbetűs ASCII')
    // kettos slug es kettos position
    expect(output).toContain(`${MODULE_DIR}/04-dupla-b/lesson.md`)
    expect(output).toContain('Ismétlődő slug')
    expect(output).toContain('Ismétlődő position')
    // rossz szint es nyelv
    expect(output).toContain(`${MODULE_DIR}/04-dupla-b/exercises/01-rossz-szint.yml`)
    expect(output).toContain('„nehez”')
    expect(output).toContain(`${MODULE_DIR}/04-dupla-b/exercises/02-rossz-nyelv.yml`)
    expect(output).toContain('„ruby”')
  })

  test('a CRLF-es es BOM-os lesson.md ugyanugy olvasodik', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-import-'))
    try {
      fs.cpSync(VALID, tmp, { recursive: true })
      const lessonFile = path.join(tmp, LESSON_DIR, 'lesson.md')
      const lf = fs.readFileSync(lessonFile, 'utf8')
      fs.writeFileSync(lessonFile, '﻿' + lf.replace(/\r?\n/g, '\r\n'))

      const result = dryRun(tmp)

      expect(result.status, result.stdout + result.stderr).toBe(0)
      expect(reportedLength(result.stdout)).toBe(bodyLength(lf))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  test('a torzsben levo --- vizszintes vonal megmarad', () => {
    const lf = fs.readFileSync(path.join(VALID, LESSON_DIR, 'lesson.md'), 'utf8')
    expect(lf.slice(lf.indexOf('\n---\n', 3) + 5)).toContain('\n---\n')

    const result = dryRun(VALID)

    expect(reportedLength(result.stdout)).toBe(bodyLength(lf))
  })
})
