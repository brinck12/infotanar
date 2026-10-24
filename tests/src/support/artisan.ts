/**
 * `php artisan` hivasok a teszt-backend fixture adatbazisan (database/testing.sqlite):
 * olyan allapot felallitasa, amelyhez nincs HTTP-vegpont (kor szerint regi sorok, vizsgaprobalkozas),
 * es a utemezett takaritasok (megorzesi job, arva fajlok) lefuttatasa. Mas adatbazishoz nem nyul.
 *
 * Az adatbazis a `test:prepare-api-fixtures` utan all; az itt irt sorokat a tesztek maguk takaritjak.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import path from 'node:path'
import { env } from '../../config/env'
import { TEST_APP_KEY } from '../../config/web-servers'

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
    // Ugyanaz a kulcs es cim, mint a teszt-szerveren: a tinkerben keszult alairt linkek (pl. leiratkozas) a szerveren is ervenyesek.
    APP_KEY: TEST_APP_KEY,
    FRONTEND_URL: env.BASE_URL,
    APP_URL: new URL(env.API_BASE_URL).origin,
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
export function rowCount(
  table: 'file_submissions' | 'exam_attempts' | 'oral_practices' | 'consents' | 'social_accounts' | 'lesson_completions',
  userId: number
): number {
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

/** A felhasznalo `preferences` oszlopa a nyers adatbazisbol (torolt fiokot is lat). */
export function storedPreferences(userId: number): unknown {
  return tinkerJson(`return Illuminate\\Support\\Facades\\DB::table('users')->where('id', ${String(userId)})->value('preferences');`)
}

/** Szobeli gyakorlas sort ir egy (akar torolt) felhasznalonak: a seprés tesztjehez. */
export function plantOralPractice(userId: number): void {
  tinkerJson(`App\\Models\\OralPractice::query()->create(['user_id' => ${String(userId)}, 'topic' => 'szovegszerkesztes']); return true;`)
}

/** Egy artisan parancs eredmenye: nem dob nem-nulla kilepesi kodra (a hibaeseteket tesztelni lehessen). */
export interface ArtisanResult {
  status: number
  stdout: string
  stderr: string
}

/** Lefuttat egy artisan parancsot, es a kilepesi kodot, valamint a kimeneteket adja vissza. */
export function artisanResult(args: string[]): ArtisanResult {
  const result = spawnSync('php', ['artisan', ...args], {
    cwd: BACKEND_DIR,
    env: backendEnv(),
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })

  return { status: result.status ?? 1, stdout: result.stdout, stderr: result.stderr }
}

/**
 * Lecketeljesitest ir a felhasznalonak (egy, meg nem teljesitett leckere), a MOSTANI magyar het hetfo 00:00-jatol
 * szamitott percekkel: 30 = hetfo 00:30, 7 * 24 * 60 - 30 = a het vasarnapjanak 23:30-a, -30 = az elozo het vasarnap 23:30-a.
 * A hatarok ellenorzesehez kell, amit valodi ido mellett nem lehetne elerni.
 */
export function plantLessonCompletion(userId: number, minutesFromWeekStart: number): void {
  tinkerJson(`
    $when = Carbon\\CarbonImmutable::now('Europe/Budapest')->startOfWeek()->startOfDay()->addMinutes(${String(minutesFromWeekStart)});
    $done = App\\Models\\LessonCompletion::query()->where('user_id', ${String(userId)})->pluck('lesson_id');
    $lesson = App\\Models\\Lesson::query()->whereNotIn('id', $done)->firstOrFail();
    App\\Models\\LessonCompletion::query()->create(['user_id' => ${String(userId)}, 'lesson_id' => $lesson->id, 'completed_at' => $when]);
    return true;
  `)
}

/** A heti osszefoglalo e-mail job szinkron futtatasa (vasarnap este az utemezo teszi). */
export function runWeeklySummaries(): void {
  tinkerJson(`app()->call([new App\\Jobs\\SendWeeklySummaries, 'handle']); return true;`)
}

/** A heti osszefoglalo kapcsoloja es a kuldes lefoglalasa a nyers adatbazisbol (torolt fiokot is lat). */
export function weeklySummaryState(userId: number): { optIn: boolean; sentAt: string | null } {
  return tinkerJson(`
    $row = Illuminate\\Support\\Facades\\DB::table('users')->where('id', ${String(userId)})->first(['weekly_summary_opt_in', 'weekly_summary_sent_at']);
    return ['optIn' => (bool) $row->weekly_summary_opt_in, 'sentAt' => $row->weekly_summary_sent_at];
  `) as { optIn: boolean; sentAt: string | null }
}

/** A heti osszefoglalo kapcsolojat kozvetlenul allitja (olyan allapothoz, amelyhez nincs vegpont: pl. nem megerositett cim). */
export function forceWeeklySummary(userId: number, optIn: boolean, sentDaysAgo?: number): void {
  const sentAt = sentDaysAgo === undefined ? 'null' : `now()->subDays(${String(sentDaysAgo)})`
  tinkerJson(
    `Illuminate\\Support\\Facades\\DB::table('users')->where('id', ${String(userId)})->update(['weekly_summary_opt_in' => ${optIn ? 'true' : 'false'}, 'weekly_summary_sent_at' => ${sentAt}]); return true;`
  )
}

/** Megerositetlenne teszi a felhasznalo e-mail-cimet (a megerositest igenylo agakhoz). */
export function unverifyEmail(userId: number): void {
  tinkerJson(`Illuminate\\Support\\Facades\\DB::table('users')->where('id', ${String(userId)})->update(['email_verified_at' => null]); return true;`)
}
