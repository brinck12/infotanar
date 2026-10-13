/**
 * `php artisan` hivasok a teszt-backend fixture adatbazisan (database/testing.sqlite):
 * olyan allapot felallitasa, amelyhez nincs HTTP-vegpont (kor szerint regi sorok, vizsgaprobalkozas),
 * es a utemezett takaritasok (megorzesi job, arva fajlok) lefuttatasa. Mas adatbazishoz nem nyul.
 *
 * Az adatbazis a `test:prepare-api-fixtures` utan all; az itt irt sorokat a tesztek maguk takaritjak.
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'

export const BACKEND_DIR = path.resolve(process.env.TEST_BACKEND_PATH ?? path.join(__dirname, '../../../backend'))

function backendEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    APP_ENV: 'testing',
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: path.join(BACKEND_DIR, 'database', 'testing.sqlite'),
    CACHE_STORE: 'file',
    QUEUE_CONNECTION: 'sync',
    MAIL_MAILER: 'outbox',
  }
}

/** Lefuttat egy artisan parancsot, es a standard kimenetet adja vissza. */
export function artisan(args: string[]): string {
  return execFileSync('php', ['artisan', ...args], {
    cwd: BACKEND_DIR,
    env: backendEnv(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 16 * 1024 * 1024,
  })
}

/**
 * PHP-kodot futtat a backend kontextusaban (tinker), es az `echo`-zott JSON-t adja vissza.
 * A kod ASCII-t tartalmazzon, es egyetlen sorban ne hasznaljon dupla idezojelet.
 */
export function tinkerJson(code: string): unknown {
  const output = artisan(['tinker', `--execute=echo '<<' . json_encode((function () { ${code} })()) . '>>';`])
  const match = /<<(.*)>>/s.exec(output)
  if (!match?.[1]) throw new Error(`A tinker kimenete nem ertelmezheto: ${output.slice(0, 500)}`)

  return JSON.parse(match[1])
}

/** A megorzesi job (PruneExpiredFileSubmissions) szinkron futtatasa. */
export function runRetentionJob(): void {
  tinkerJson('app()->call([new App\\Jobs\\PruneExpiredFileSubmissions, \'handle\']); return true;')
}

/** `files:prune-orphans` futtatasa; a parancs kimenetet adja vissza. */
export function pruneOrphans(): string {
  return artisan(['files:prune-orphans'])
}

/** Egy vizsgaprobalkozas ES egy hozza tartozo fajlbeadas (valodi fajllal a lemezen), a WP6 vegpontok nelkul. */
export interface SeededExamAttempt {
  attemptId: number
  submissionId: number
  /** A fajl relativ utvonala a `submission-files` tarolon. */
  path: string
}

/**
 * Vizsgaprobalkozast ir a felhasznalonak az 1. vizsgara (1. resz, 5. feladat), egy mar ertekelt,
 * 10/10-es fajlbeadassal. `ageDays`: ennyi napos a sor (a megorzesi job tesztjehez).
 */
export function seedExamAttempt(userId: number, ageDays = 0): SeededExamAttempt {
  return tinkerJson(`
    $when = now()->subDays(${String(ageDays)});
    $attempt = App\\Models\\ExamAttempt::query()->create(['user_id' => ${String(userId)}, 'exam_id' => 1, 'mode' => 'practice', 'state' => 'evaluated', 'in_progress_marker' => null, 'started_at' => $when, 'submitted_at' => $when, 'evaluated_at' => $when, 'last_activity_at' => $when, 'score' => 10, 'max_score' => 20, 'result' => []]);
    $path = 'u${String(userId)}/exam' . $attempt->id . '/pw-vizsga.xlsx';
    Illuminate\\Support\\Facades\\Storage::disk('submission_files')->put($path, 'vizsga');
    $row = App\\Models\\FileSubmission::query()->create(['user_id' => ${String(userId)}, 'exercise_id' => 5, 'exam_attempt_id' => $attempt->id, 'exam_part_id' => 1, 'attempt' => 1, 'status' => 'evaluated', 'original_name' => 'pw-vizsga.xlsx', 'path' => $path, 'extension' => '.xlsx', 'size' => 6, 'sha256' => str_repeat('a', 64), 'score' => 10, 'max_score' => 10, 'passed' => true, 'result' => ['groups' => [], 'items' => [], 'facts' => []]]);
    App\\Models\\ExamAttempt::query()->whereKey($attempt->id)->update(['created_at' => $when]);
    App\\Models\\FileSubmission::query()->whereKey($row->id)->update(['created_at' => $when]);
    return ['attemptId' => $attempt->id, 'submissionId' => $row->id, 'path' => $path];
  `) as SeededExamAttempt
}

/** A gyakorlo (vizsgasor nelkuli) fajlbeadasok `created_at` erteket visszaallitja `ageDays` napra. */
export function ageFileSubmission(id: number, ageDays: number): void {
  tinkerJson(`App\\Models\\FileSubmission::query()->whereKey(${String(id)})->update(['created_at' => now()->subDays(${String(ageDays)})]); return true;`)
}

/** Hany sor van a megadott tablaban a felhasznalo azonositojaval (user_id). */
export function rowCount(table: 'file_submissions' | 'exam_attempts' | 'oral_practices', userId: number): number {
  return Number(tinkerJson(`return Illuminate\\Support\\Facades\\DB::table('${table}')->where('user_id', ${String(userId)})->count();`))
}

/** Mennyi lekerdezes fut egy ExerciseStatuses::for hivasban (a felhasznalo adott allapotaval). */
export function statusQueryCount(userId: number): number {
  return Number(tinkerJson(`
    $user = App\\Models\\User::query()->findOrFail(${String(userId)});
    Illuminate\\Support\\Facades\\DB::enableQueryLog();
    App\\Services\\Progress\\ExerciseStatuses::for($user);
    return count(Illuminate\\Support\\Facades\\DB::getQueryLog());
  `))
}
