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
const LESSON_PATH = 'pw-import-track/pw-import-modul/pw-import-lecke'

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

/** Torli a teszt altal letrehozott (pw-import- elotagu) katalogus-sorokat. */
function cleanup(): void {
  tinkerJson(`
    foreach (App\\Models\\Track::query()->where('slug', 'like', 'pw-import-%')->get() as $t) {
      foreach ($t->modules()->get() as $m) {
        foreach ($m->lessons()->get() as $l) {
          foreach ($l->exercises()->get() as $e) { $e->testCases()->delete(); $e->delete(); }
          $l->delete();
        }
        $m->delete();
      }
      $t->delete();
    }
    return true;
  `)
}

/** A fajlfabol letrehozza az adatbazis-allapotot (az eles importer meg nincs); a leckek publikaltsaga megadhato. */
function seedFrom(root: string, lessonPublished = false): void {
  const dir = root.replaceAll(path.sep, '/')
  tinkerJson(`
    $set = app(App\\Services\\Catalog\\Content\\ContentReader::class)->read('${dir}');
    foreach ($set->tracks as $t) {
      $track = App\\Models\\Track::query()->create($t->attributes);
      foreach ($t->modules as $m) {
        $module = $track->modules()->create($m->attributes);
        foreach ($m->lessons as $l) {
          $lesson = $module->lessons()->create([...$l->attributes, 'content' => $l->content, 'is_published' => ${lessonPublished ? 'true' : 'false'}]);
          foreach ($l->exercises as $e) {
            $a = $e->attributes;
            unset($a['slug'], $a['limits'], $a['tests']);
            $exercise = $lesson->exercises()->create($a);
            foreach ($e->testCases as $c) { $exercise->testCases()->create($c); }
          }
        }
      }
    }
    return true;
  `)
}

function withTmpCopy(edit: (root: string) => void, run: (root: string) => void): void {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-import-'))
  try {
    fs.cpSync(VALID, tmp, { recursive: true })
    edit(tmp)
    run(tmp)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

test.describe('catalog:import --dry-run @regression', () => {
  test.beforeEach(() => {
    cleanup()
  })

  test.afterEach(() => {
    cleanup()
  })

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

  test('ures adatbazison a valid fa minden eleme uj', () => {
    const result = dryRun(VALID)

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain('+ új track pw-import-track')
    expect(result.stdout).toContain('+ új modul pw-import-track/pw-import-modul')
    expect(result.stdout).toContain(`+ új lecke ${LESSON_PATH}`)
    expect(result.stdout).toContain(`+ új feladat ${LESSON_PATH}/pw-import-osszeg`)
    expect(result.stdout).toContain(`+ új feladat ${LESSON_PATH}/pw-import-lekerdezes`)
  })

  test('import utan a fa valtozatlan, a megvaltozott cim pontosan a title mezot jelzi', () => {
    seedFrom(VALID)

    const same = dryRun(VALID)
    expect(same.status, same.stdout + same.stderr).toBe(0)
    expect(same.stdout).toContain(`= változatlan lecke ${LESSON_PATH}`)
    expect(same.stdout).toContain(`= változatlan feladat ${LESSON_PATH}/pw-import-osszeg`)
    expect(same.stdout).toContain('0 új lecke, 0 új feladat')
    expect(same.stdout).not.toMatch(/^[+~-] /m)

    withTmpCopy(
      (root) => {
        const file = path.join(root, LESSON_DIR, 'lesson.md')
        fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('title: PW import lecke', 'title: PW import lecke 2'))
      },
      (root) => {
        const changed = dryRun(root)
        expect(changed.status, changed.stdout + changed.stderr).toBe(0)
        expect(changed.stdout).toContain(`~ módosít lecke ${LESSON_PATH} (title)`)
        expect(changed.stdout).toContain(`= változatlan feladat ${LESSON_PATH}/pw-import-osszeg`)
      },
    )
  })

  test('a feladat megvaltozott teszteset-listaja a tests mezot jelzi', () => {
    seedFrom(VALID)

    withTmpCopy(
      (root) => {
        const file = path.join(root, LESSON_DIR, 'exercises', '01-pw-import-osszeg.yml')
        fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('expected: "9\\n"', 'expected: "10\\n"'))
      },
      (root) => {
        const result = dryRun(root)
        expect(result.stdout).toContain(`~ módosít feladat ${LESSON_PATH}/pw-import-osszeg (tests)`)
      },
    )
  })

  test('a fajlokbol hianyzo, publikalt lecke elrejtesre kerul', () => {
    seedFrom(VALID, true)

    withTmpCopy(
      (root) => { fs.rmSync(path.join(root, LESSON_DIR), { recursive: true, force: true }); },
      (root) => {
        const result = dryRun(root)
        expect(result.status, result.stdout + result.stderr).toBe(0)
        expect(result.stdout).toContain(`- elrejt lecke ${LESSON_PATH} (nem publikált lesz)`)
      },
    )
  })

  test('a terv lekerdezese utan semmi nem valtozik az adatbazisban', () => {
    seedFrom(VALID)
    const before = tinkerJson(`return App\\Models\\Lesson::query()->where('slug', 'pw-import-lecke')->value('updated_at');`)

    dryRun(VALID)

    const after = tinkerJson(`return App\\Models\\Lesson::query()->where('slug', 'pw-import-lecke')->value('updated_at');`)
    expect(after).toBe(before)
  })
})
