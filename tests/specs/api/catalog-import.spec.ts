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
    App\\Models\\AuditLog::query()->where('action', 'catalog_imported')->delete();
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

  test('az --only a testverlecket nem rejti el', () => {
    seedFrom(VALID, true)

    withTmpCopy(
      (root) => {
        const moduleDir = path.join(root, MODULE_DIR)
        const dirA = path.join(moduleDir, '01-pw-import-lecke')
        const dirB = path.join(moduleDir, '02-pw-import-lecke-b')
        fs.cpSync(dirA, dirB, { recursive: true })
        fs.rmSync(dirA, { recursive: true, force: true })
        const file = path.join(dirB, 'lesson.md')
        fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('slug: pw-import-lecke', 'slug: pw-import-lecke-b').replace('position: 0', 'position: 1'))
      },
      (root) => {
        const scoped = artisanResult(['catalog:import', '--dry-run', `--path=${root}`, '--only=pw-import-track/pw-import-modul/pw-import-lecke-b'])
        expect(scoped.status, scoped.stdout + scoped.stderr).toBe(0)
        expect(scoped.stdout).not.toContain('- elrejt')

        const full = dryRun(root)
        expect(full.stdout).toContain(`- elrejt lecke ${LESSON_PATH} (nem publikált lesz)`)
      },
    )
  })

  test('a mar nem publikalt, eltunt lecke nem kerul az elrejtendok koze', () => {
    seedFrom(VALID)

    withTmpCopy(
      (root) => { fs.rmSync(path.join(root, LESSON_DIR), { recursive: true, force: true }); },
      (root) => {
        const result = dryRun(root)
        expect(result.status, result.stdout + result.stderr).toBe(0)
        expect(result.stdout).not.toContain('- elrejt')
      },
    )
  })

  test('a fajlokbol eltunt, publikalt feladat elrejtesre kerul', () => {
    seedFrom(VALID)
    tinkerJson("App\\Models\\Exercise::query()->update(['is_published' => true]); return true;")

    withTmpCopy(
      (root) => { fs.rmSync(path.join(root, LESSON_DIR, 'exercises', '02-pw-import-lekerdezes.yml')); },
      (root) => {
        const result = dryRun(root)
        expect(result.status, result.stdout + result.stderr).toBe(0)
        expect(result.stdout).toContain(`- elrejt feladat ${LESSON_PATH}/pw-import-lekerdezes (nem publikált lesz)`)
        expect(result.stdout).not.toContain(`- elrejt feladat ${LESSON_PATH}/pw-import-osszeg`)
      },
    )
  })

  test('az --only, ami semmire nem illik, hibaval all le', () => {
    const result = artisanResult(['catalog:import', '--dry-run', `--path=${VALID}`, '--only=pw-import-track/nincs-ilyen'])

    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).toContain('nincs találat')
  })

  test('ervenytelen constraints a fajlt es a constraints mezot nevezi meg', () => {
    withTmpCopy(
      (root) => {
        editSqlExercise(root, (text) => text.replace('sql_order_sensitive: false', 'sql_order_sensitive: false\nconstraints:\n  ismeretlen_kulcs: [x]'))
      },
      (root) => {
        const result = dryRun(root)
        const output = result.stdout + result.stderr

        expect(result.status, output).toBe(1)
        expect(output).toContain(`${LESSON_DIR}/exercises/02-pw-import-lekerdezes.yml`)
        expect(output).toContain('constraints')
      },
    )
  })

  test('az sql fajta csak az [sql] nyelvvel ervenyes, es forditva', () => {
    withTmpCopy(
      (root) => {
        editSqlExercise(root, (text) => text.replace('allowed_languages: [sql]', 'allowed_languages: [python]').replace('  sql: SELECT 1;', '  python: print(1)'))
      },
      (root) => {
        const result = dryRun(root)

        expect(result.status, result.stdout + result.stderr).toBe(1)
        expect(result.stdout + result.stderr).toContain('02-pw-import-lekerdezes.yml')
        expect(result.stdout + result.stderr).toContain('egyetlen eleme az „sql”')
      },
    )

    withTmpCopy(
      (root) => {
        editSqlExercise(root, (text) => text.replace('kind: sql', 'kind: code'))
      },
      (root) => {
        const result = dryRun(root)

        expect(result.status, result.stdout + result.stderr).toBe(1)
        expect(result.stdout + result.stderr).toContain('fajtája „sql” kell legyen')
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

function importLive(root: string, extra: string[] = []): ReturnType<typeof artisanResult> {
  return artisanResult(['catalog:import', `--path=${root}`, ...extra])
}

const EMPTY_STATE = [0, [], [], []]

/** A pw-import- elotagu sorok darabszama es a lecke/feladat/teszteset updated_at-jei. */
function snapshot(): unknown {
  return tinkerJson(`
    $lessons = App\\Models\\Lesson::query()->where('slug', 'like', 'pw-import-%')->orderBy('id');
    $exercises = App\\Models\\Exercise::query()->whereIn('lesson_id', (clone $lessons)->pluck('id'))->orderBy('id');
    $cases = App\\Models\\TestCase::query()->whereIn('exercise_id', (clone $exercises)->pluck('id'))->orderBy('id');
    return [
      App\\Models\\Track::query()->where('slug', 'like', 'pw-import-%')->count(),
      $lessons->pluck('updated_at')->all(),
      $exercises->pluck('updated_at')->all(),
      $cases->pluck('updated_at')->all(),
    ];
  `)
}

/** A lekerdezes-feladat fajljat modositja egy tmp masolaton. */
function editSqlExercise(root: string, edit: (text: string) => string): void {
  const file = path.join(root, LESSON_DIR, 'exercises', '02-pw-import-lekerdezes.yml')
  fs.writeFileSync(file, edit(fs.readFileSync(file, 'utf8')))
}

test.describe('catalog:import eles import @regression', () => {
  test.beforeEach(() => {
    cleanup()
  })

  test.afterEach(() => {
    cleanup()
  })

  test('a valid fa letrejon, a tartalom szo szerint egyezik', () => {
    withTmpCopy(
      (root) => {
        const lesson = path.join(root, LESSON_DIR, 'lesson.md')
        fs.writeFileSync(lesson, fs.readFileSync(lesson, 'utf8') + '\nEmoji: 😀 és CRLF\r\nsor.\r\n')
        editSqlExercise(root, (text) => text.replace('CREATE TABLE t(a);', 'CREATE TABLE t(a); -- 😀 ékezet'))
        const sum = path.join(root, LESSON_DIR, 'exercises', '01-pw-import-osszeg.yml')
        fs.writeFileSync(sum, fs.readFileSync(sum, 'utf8').replace('published: false', 'published: true'))
      },
      (root) => {
        const result = importLive(root)
        expect(result.status, result.stdout + result.stderr).toBe(0)

        const lf = fs.readFileSync(path.join(root, LESSON_DIR, 'lesson.md'), 'utf8').replace(/\r\n/g, '\n')
        const body = lf.slice(lf.indexOf('\n---\n', 3) + 5)
        const state = tinkerJson(`
          $lesson = App\\Models\\Lesson::query()->where('slug', 'pw-import-lecke')->firstOrFail();
          $exercises = $lesson->exercises()->orderBy('position')->get();
          return [
            $lesson->content,
            $exercises->count(),
            $exercises[0]->testCases()->count(),
            $exercises[1]->testCases()->pluck('stdin')->all(),
            $exercises[1]->testCases()->pluck('expected_stdout')->all(),
            $exercises[0]->is_published,
          ];
        `) as unknown[]
        expect(state).toEqual([body, 2, 2, ['CREATE TABLE t(a); -- 😀 ékezet'], ['1\n'], true])
      },
    )
  })

  test('a masodik futtatas nulla valtoztatas, az updated_at sem mozdul', () => {
    const first = importLive(VALID)
    expect(first.status, first.stdout + first.stderr).toBe(0)
    expect(first.stdout).toContain('5 létrehozva, 0 módosítva, 0 elrejtve')
    const before = snapshot()

    const second = importLive(VALID)

    expect(second.status, second.stdout + second.stderr).toBe(0)
    expect(second.stdout).toContain('0 létrehozva, 0 módosítva, 0 elrejtve')
    expect(snapshot()).toEqual(before)
  })

  test('hibas fa eseten semmi nem irodik', () => {
    const result = importLive(INVALID)

    expect(result.status).toBe(1)
    expect(snapshot()).toEqual(EMPTY_STATE)
  })

  test('nem domain kivetel eseten magyar hibaval all le, es semmi nem irodik', () => {
    tinkerJson(`
      DB::unprepared("CREATE TRIGGER pw_import_boom BEFORE INSERT ON exercises BEGIN SELECT RAISE(ABORT, 'pw-import boom'); END;");
      return true;
    `)
    try {
      const result = importLive(VALID)
      const output = result.stdout + result.stderr

      expect(result.status, output).toBe(1)
      expect(output).toContain('Az import elutasítva, semmi nem íródott')
      expect(output).toContain('pw-import boom')
      expect(snapshot()).toEqual(EMPTY_STATE)
    } finally {
      tinkerJson('DB::unprepared("DROP TRIGGER IF EXISTS pw_import_boom"); return true;')
    }
  })

  test('nyilvanos teszteset nelkuli, publikalt feladat az egesz importot elutasitja', () => {
    withTmpCopy(
      (root) => {
        editSqlExercise(root, (text) => text.replace('allowed_languages: [sql]', 'published: true\nallowed_languages: [sql]').replace('hidden: false', 'hidden: true'))
      },
      (root) => {
        const result = importLive(root)

        expect(result.status).toBe(1)
        expect(result.stdout + result.stderr).toContain('Publikált feladatnak legalább egy nyilvános tesztesettel kell rendelkeznie')
        expect(snapshot()).toEqual(EMPTY_STATE)
      },
    )
  })

  test('mintamegoldas nelkuli, publikalt feladat az egesz importot elutasitja', () => {
    withTmpCopy(
      (root) => {
        editSqlExercise(root, (text) => text.replace('allowed_languages: [sql]', 'published: true\nallowed_languages: [sql]').replace('sample_solutions:\n  sql: SELECT 1;\n', ''))
      },
      (root) => {
        const result = importLive(root)

        expect(result.status, result.stdout + result.stderr).toBe(1)
        expect(snapshot()).toEqual(EMPTY_STATE)
      },
    )
  })

  test('az eltunt lecke nem publikalt lesz, nem torlodik', () => {
    withTmpCopy(
      (root) => {
        const file = path.join(root, LESSON_DIR, 'lesson.md')
        fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('published: false', 'published: true'))
      },
      (root) => {
        expect(importLive(root).status).toBe(0)
        expect(tinkerJson("return App\\Models\\Lesson::query()->where('slug', 'pw-import-lecke')->value('is_published');")).toBe(true)

        fs.rmSync(path.join(root, LESSON_DIR), { recursive: true, force: true })
        const result = importLive(root)

        expect(result.status, result.stdout + result.stderr).toBe(0)
        expect(result.stdout).toContain('0 létrehozva, 0 módosítva, 1 elrejtve')
        expect(tinkerJson("return App\\Models\\Lesson::query()->where('slug', 'pw-import-lecke')->pluck('is_published')->all();")).toEqual([false])
      },
    )
  })

  test('a tesztesetek a fajl sorrendjeben irodnak felul, a kivett teszt eltunik', () => {
    expect(importLive(VALID).status).toBe(0)

    withTmpCopy(
      (root) => {
        const file = path.join(root, LESSON_DIR, 'exercises', '01-pw-import-osszeg.yml')
        const text = fs.readFileSync(file, 'utf8')
        const edited = text.replace('  - { stdin: "3\\n", expected: "9\\n", hidden: false }\n', '  - { stdin: "5\\n", expected: "25\\n", hidden: false }\n').replace('  - { stdin: "0\\n", expected: "0\\n", hidden: true }\n', '')
        expect(edited).not.toBe(text)
        fs.writeFileSync(file, edited)
      },
      (root) => {
        const result = importLive(root)
        expect(result.status, result.stdout + result.stderr).toBe(0)
        expect(result.stdout).toContain('0 létrehozva, 1 módosítva, 0 elrejtve')

        const cases = tinkerJson(`
          $e = App\\Models\\Exercise::query()->where('title', 'like', 'PW import %sszeg')->firstOrFail();
          return $e->testCases()->orderBy('order')->get()->map(fn ($c) => [$c->stdin, $c->order])->all();
        `)
        expect(cases).toEqual([['5\n', 0]])
      },
    )
  })

  test('a catalog_imported audit esemeny csak darabszamokat tartalmaz', () => {
    expect(importLive(VALID).status).toBe(0)

    const metadata = tinkerJson(`
      return App\\Models\\AuditLog::query()->where('action', 'catalog_imported')->firstOrFail()->metadata;
    `)
    expect(metadata).toEqual({ created: 5, updated: 0, unpublished: 0 })
  })
})

function exportTo(root: string, extra: string[] = []): ReturnType<typeof artisanResult> {
  return artisanResult(['catalog:export', `--path=${root}`, '--only=pw-import-track', ...extra])
}

/** Egy kiexportalt fa fajljai (relativ utvonal, `/` elvalasztoval), rendezve. */
function listFiles(root: string): string[] {
  return fs
    .readdirSync(root, { recursive: true, encoding: 'utf8' })
    .map((entry) => entry.replaceAll(path.sep, '/'))
    .filter((entry) => fs.statSync(path.join(root, entry)).isFile())
    .sort()
}

/** A pw-import- tartalom nyers allapota: a koruton atmeno egyezes ellenorzesehez. */
function contentState(): unknown {
  return tinkerJson(`
    $lesson = App\\Models\\Lesson::query()->where('slug', 'pw-import-lecke')->firstOrFail();
    return [
      $lesson->content,
      $lesson->is_free,
      $lesson->exercises()->orderBy('position')->get()->map(fn ($e) => [
        $e->title, $e->position, $e->kind->value, $e->description, $e->starter_code, $e->sample_solutions,
        $e->allowed_languages, $e->sql_order_sensitive, $e->time_limit_ms,
        $e->testCases()->orderBy('order')->get()->map(fn ($c) => [$c->stdin, $c->expected_stdout, $c->is_hidden])->all(),
      ])->all(),
    ];
  `)
}

test.describe('catalog:export @regression', () => {
  let out: string

  test.beforeEach(() => {
    cleanup()
    out = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-import-export-'))
  })

  test.afterEach(() => {
    fs.rmSync(out, { recursive: true, force: true })
    cleanup()
  })

  test('korut: import -> export -> ujraimport nulla valtozas, a fajlok ervenyesek', () => {
    expect(importLive(VALID).status).toBe(0)
    const before = snapshot()

    const exported = exportTo(out)
    expect(exported.status, exported.stdout + exported.stderr).toBe(0)
    expect(listFiles(out)).toEqual([
      'pw-import-track/01-pw-import-modul/01-pw-import-lecke/exercises/01-pw-import-osszeg.yml',
      'pw-import-track/01-pw-import-modul/01-pw-import-lecke/exercises/02-pw-import-lekerdezes.yml',
      'pw-import-track/01-pw-import-modul/01-pw-import-lecke/lesson.md',
      'pw-import-track/01-pw-import-modul/_module.yml',
      'pw-import-track/_track.yml',
    ])

    const check = dryRun(out)
    expect(check.status, check.stdout + check.stderr).toBe(0)

    const again = importLive(out)
    expect(again.status, again.stdout + again.stderr).toBe(0)
    expect(again.stdout).toContain('0 létrehozva, 0 módosítva, 0 elrejtve')
    expect(snapshot()).toEqual(before)
  })

  test('a lesson.md torzse szo szerint egyezik a forrassal', () => {
    expect(importLive(VALID).status).toBe(0)
    expect(exportTo(out).status).toBe(0)

    const original = fs.readFileSync(path.join(VALID, LESSON_DIR, 'lesson.md'), 'utf8')
    const exported = fs.readFileSync(path.join(out, LESSON_DIR, 'lesson.md'), 'utf8')
    expect(exported.slice(exported.indexOf('\n---\n', 3))).toBe(original.slice(original.indexOf('\n---\n', 3)))
  })

  test('nehez szovegek (ekezet, emoji, sorveg nelkuli stdin, --- sor, szokoz, CR) vesztesegmentesen korbeernek', () => {
    withTmpCopy(
      (root) => {
        const lesson = path.join(root, LESSON_DIR, 'lesson.md')
        fs.writeFileSync(lesson, fs.readFileSync(lesson, 'utf8') + '\nEmoji: 😀 ékezet\n---\nutolsó sor záró sortörés nélkül')
        const sum = path.join(root, LESSON_DIR, 'exercises', '01-pw-import-osszeg.yml')
        const edited = fs
          .readFileSync(sum, 'utf8')
          .replace(/description: \|\n.*\n/, 'description: "Első sor 😀  \\n---\\n  behúzott sor  \\n\\nutolsó"\n')
          .replace(
            /tests:\n[\s\S]*$/,
            'tests:\n  - { stdin: "3", expected: "9", hidden: false }\n  - { stdin: "---\\n  szóköz  \\n", expected: "a\\r\\nb\\rc\\n\\n", hidden: true }\n  - { stdin: "", expected: "😀\\n", hidden: false }\n',
          )
        fs.writeFileSync(sum, edited)
      },
      (root) => {
        expect(importLive(root).status).toBe(0)
        const state = contentState()

        expect(exportTo(out).status).toBe(0)
        cleanup()
        const again = importLive(out)
        expect(again.status, again.stdout + again.stderr).toBe(0)

        expect(contentState()).toEqual(state)
      },
    )
  })

  test('meglevo fajl --force nelkul hibaval all le, es semmit nem ir', () => {
    expect(importLive(VALID).status).toBe(0)
    const moduleFile = path.join(out, MODULE_DIR, '_module.yml')
    fs.mkdirSync(path.dirname(moduleFile), { recursive: true })
    fs.writeFileSync(moduleFile, 'kezi: tartalom\n')

    const result = exportTo(out)

    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).toContain('már léteznek')
    expect(result.stdout + result.stderr).toContain(`${MODULE_DIR}/_module.yml`)
    expect(listFiles(out)).toEqual([`${MODULE_DIR}/_module.yml`])
    expect(fs.readFileSync(moduleFile, 'utf8')).toBe('kezi: tartalom\n')
  })

  test('--force felulirja a fajlt, de a lesson.md reviewed_by/reviewed_at mezoit megorzi', () => {
    expect(importLive(VALID).status).toBe(0)
    expect(exportTo(out).status).toBe(0)

    const lesson = path.join(out, LESSON_DIR, 'lesson.md')
    const stamped = fs
      .readFileSync(lesson, 'utf8')
      .replace('reviewed_by:\n', 'reviewed_by: Teszt Elek\n')
      .replace('reviewed_at:\n', 'reviewed_at: 2026-10-01\n')
    expect(stamped).toContain('reviewed_by: Teszt Elek')
    fs.writeFileSync(lesson, stamped)
    fs.writeFileSync(path.join(out, MODULE_DIR, '_module.yml'), 'kezi: tartalom\n')

    const result = exportTo(out, ['--force'])

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(fs.readFileSync(path.join(out, MODULE_DIR, '_module.yml'), 'utf8')).toContain('slug: pw-import-modul')
    const rewritten = fs.readFileSync(lesson, 'utf8')
    expect(rewritten).toMatch(/reviewed_by: '?Teszt Elek'?$/m)
    expect(rewritten).toMatch(/reviewed_at: '?2026-10-01'?/)
    const check = dryRun(out)
    expect(check.status, check.stdout + check.stderr).toBe(0)
  })

  test('a nem szerkesztos feladatot kihagyja, egysoros jelzessel', () => {
    expect(importLive(VALID).status).toBe(0)
    tinkerJson(`
      $lesson = App\\Models\\Lesson::query()->where('slug', 'pw-import-lecke')->firstOrFail();
      $lesson->exercises()->create(['title' => 'PW import tablazat', 'kind' => 'sheet_upload', 'allowed_languages' => [], 'description' => 'x', 'level' => 'kozep', 'difficulty' => 1, 'position' => 5]);
      return true;
    `)

    const result = exportTo(out)

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain('Kihagyva')
    expect(result.stdout).toContain('pw-import-tablazat')
    expect(listFiles(out).filter((file) => file.includes('tablazat'))).toEqual([])
  })

  test('a 100. sorszam harom jegyu mappanevet kap, es a fa ervenyes marad', () => {
    expect(importLive(VALID).status).toBe(0)
    tinkerJson("App\\Models\\Lesson::query()->where('slug', 'pw-import-lecke')->update(['position' => 99]); return true;")

    expect(exportTo(out).status).toBe(0)

    expect(listFiles(out)).toContain('pw-import-track/01-pw-import-modul/100-pw-import-lecke/lesson.md')
    const check = dryRun(out)
    expect(check.status, check.stdout + check.stderr).toBe(0)
  })

  test('a CR-t tartalmazo leckeszoveg hibaval all le, es semmit nem ir', () => {
    expect(importLive(VALID).status).toBe(0)
    tinkerJson("App\\Models\\Lesson::query()->where('slug', 'pw-import-lecke')->update(['content' => 'a' . chr(13) . chr(10) . 'b']); return true;")

    const result = exportTo(out)

    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).toContain('nem írható ki veszteség nélkül')
    expect(listFiles(out)).toEqual([])
  })

  test('ket azonos cimu feladat egy leckeben hibaval all le, es semmit nem ir', () => {
    expect(importLive(VALID).status).toBe(0)
    tinkerJson(`
      $lesson = App\\Models\\Lesson::query()->where('slug', 'pw-import-lecke')->firstOrFail();
      foreach ([5, 6] as $position) {
        $lesson->exercises()->create(['title' => 'PW import dupla', 'kind' => 'code', 'allowed_languages' => ['python'], 'description' => 'x', 'level' => 'kozep', 'difficulty' => 1, 'position' => $position]);
      }
      return true;
    `)

    const result = exportTo(out)

    expect(result.status).toBe(1)
    expect(result.stdout + result.stderr).toContain('Ütköző')
    expect(result.stdout + result.stderr).toContain('PW import dupla')
    expect(listFiles(out)).toEqual([])
  })

  test('--force-szal a nem olvashato lesson.md-hez figyelmeztetes jar, a kilepesi kod 0', () => {
    expect(importLive(VALID).status).toBe(0)
    expect(exportTo(out).status).toBe(0)
    const lesson = path.join(out, LESSON_DIR, 'lesson.md')
    fs.writeFileSync(lesson, 'nincs fejlec\n')

    const result = exportTo(out, ['--force'])

    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(result.stdout).toContain('nem őrizhető meg')
    expect(fs.readFileSync(lesson, 'utf8').startsWith('---\n')).toBe(true)
  })
})
