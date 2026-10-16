/**
 * A backend megbizhatosagi es adatvedelmi javitasainak (B01, B07, B10, PRIV-3, PRIV-4, PRIV-10) ellenorzesehez
 * szukseges allapot-lekerdezesek es -felallitasok a teszt-adatbazison (tinker). A kod ASCII, dupla idezojel nelkul.
 */
import { tinkerJson } from './artisan'

/** A seedelt piszkozat-track feladata es leckeje (cim alapjan, mert az azonosito a seeder sorrendjetol fugg). */
export function draftTrackIds(title: string): { exerciseId: number; lessonId: number } {
  return tinkerJson(`
    $exercise = App\\Models\\Exercise::query()->where('title', '${title}')->firstOrFail();
    return ['exerciseId' => $exercise->id, 'lessonId' => $exercise->lesson_id];
  `) as { exerciseId: number; lessonId: number }
}

/** Egy gyakorlo fajlbeadas sora az adatbazisban (a megorzesi job teszthez). */
export function practiceSubmissionIds(userId: number): number[] {
  return tinkerJson(`return App\\Models\\FileSubmission::query()->where('user_id', ${String(userId)})->whereNull('exam_attempt_id')->orderBy('id')->pluck('id')->all();`) as number[]
}

/** Az adott sorok `created_at` erteket `ageDays` napra viszi vissza. */
export function ageSubmissions(ids: number[], ageDays: number): void {
  tinkerJson(`App\\Models\\FileSubmission::query()->whereKey(${JSON.stringify(ids)})->update(['created_at' => now()->subDays(${String(ageDays)})]); return true;`)
}

export interface LanguagesProbe {
  failedCount: number
  cachedAfterFailure: number
  afterShortWait: number
}

/**
 * B07: a Judge0 /languages hibaja nem maradhat egy oraig cache-ben. Elobb elerhetetlen Judge0-val hivjuk
 * (ures), majd 30 masodperccel kesobb a mukodo mockkal: ujra le kell kerdezodnie.
 */
export function probeLanguagesCache(judge0Url: string): LanguagesProbe {
  return tinkerJson(`
    Illuminate\\Support\\Facades\\Cache::forget('judge0.languages.v2');
    config(['judge0.url' => 'http://127.0.0.1:9']);
    $service = app(App\\Services\\Judge0Service::class);
    $failed = count($service->languages());
    $cached = Illuminate\\Support\\Facades\\Cache::get('judge0.languages.v2');
    config(['judge0.url' => '${judge0Url}']);
    Carbon\\Carbon::setTestNow(now()->addSeconds(30));
    $after = count(app(App\\Services\\Judge0Service::class)->languages());
    Carbon\\Carbon::setTestNow();
    Illuminate\\Support\\Facades\\Cache::forget('judge0.languages.v2');
    return ['failedCount' => $failed, 'cachedAfterFailure' => is_array($cached) ? count($cached) : -1, 'afterShortWait' => $after];
  `) as LanguagesProbe
}

/** A belepes/jelszo-visszaallitas limiterek: hany korlatot adnak egy keresre, es azok percenkenti szama. */
export function loginLimiterAttempts(name: 'login' | 'password-reset'): number[] {
  return tinkerJson(`
    $request = Illuminate\\Http\\Request::create('/x', 'POST', ['email' => 'a@b.hu']);
    $limits = Illuminate\\Support\\Facades\\RateLimiter::limiter('${name}')($request);
    return array_map(fn ($limit) => $limit->maxAttempts, $limits);
  `) as number[]
}

/** A felhasznalo consents sorai (ip, bongeszo) a nyers adatbazisbol. */
export function consentsOf(userId: number): { ip_address: string | null; user_agent: string | null }[] {
  return tinkerJson(`return Illuminate\\Support\\Facades\\DB::table('consents')->where('user_id', ${String(userId)})->get(['ip_address', 'user_agent'])->all();`) as {
    ip_address: string | null
    user_agent: string | null
  }[]
}

/** A felhasznalohoz (szereplo vagy alany) tartozo audit sorok. */
export function auditRowsOf(userId: number): { action: string; ip_address: string | null; metadata: string | null }[] {
  return tinkerJson(`
    return Illuminate\\Support\\Facades\\DB::table('audit_logs')
      ->where(function ($q) { $q->where('actor_id', ${String(userId)})->orWhere(function ($s) { $s->where('subject_type', 'user')->where('subject_id', ${String(userId)}); }); })
      ->orderBy('id')->get(['action', 'ip_address', 'metadata'])->all();
  `) as { action: string; ip_address: string | null; metadata: string | null }[]
}

/** Az adott muvelet audit sorainak szama (barmelyik szereplo, barmelyik alany). */
export function auditCount(action: string, subjectId?: number): number {
  const subject = subjectId === undefined ? '' : `->where('subject_id', ${String(subjectId)})`
  return Number(tinkerJson(`return Illuminate\\Support\\Facades\\DB::table('audit_logs')->where('action', '${action}')${subject}->count();`))
}

/** A felhasznalo (torles utani) beadasainak forraskodja: a torolt jelolo hossza es az, hogy marad-e eredeti szoveg. */
export function submissionSources(submissionIds: number[]): { userId: number | null; sourceLength: number; containsOriginal: boolean }[] {
  return tinkerJson(`
    return Illuminate\\Support\\Facades\\DB::table('submissions')->whereIn('id', ${JSON.stringify(submissionIds)})->get(['user_id', 'source_code'])
      ->map(fn ($row) => ['userId' => $row->user_id, 'sourceLength' => strlen($row->source_code), 'containsOriginal' => str_contains($row->source_code, 'print(input')])->all();
  `) as { userId: number | null; sourceLength: number; containsOriginal: boolean }[]
}

export function lessonCompletionCount(userId: number): number {
  return Number(tinkerJson(`return Illuminate\\Support\\Facades\\DB::table('lesson_completions')->where('user_id', ${String(userId)})->count();`))
}

/**
 * B05: az egyik takarito listener hibazik (SQLite trigger megakasztja a szobeli gyakorlas torleset), a fiok
 * torlese megis vegigmegy, a tobbi takarito lefut, es a hiba naplozodik. A trigger a vegen megszunik.
 */
export function deleteWithFailingOralPurge(userId: number): { threw: boolean; completionsLeft: number; oralLeft: number; trashed: boolean } {
  return tinkerJson(`
    config(['app.key' => 'base64:IuoO2O2E2ePTfNKZ3XNlVF5ZfvMJM5zld0sDIFlKhQ8=']);
    $db = Illuminate\\Support\\Facades\\DB::class;
    $mysql = $db::connection()->getDriverName() === 'mysql';
    $db::unprepared($mysql
      ? "CREATE TRIGGER pw_block_oral BEFORE DELETE ON oral_practices FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'pw'"
      : 'CREATE TRIGGER pw_block_oral BEFORE DELETE ON oral_practices BEGIN INSERT INTO pw_missing_table VALUES (1); END');
    $user = App\\Models\\User::query()->findOrFail(${String(userId)});
    $threw = false;
    try {
      App\\Models\\OralPractice::query()->create(['user_id' => $user->id, 'topic' => 'szovegszerkesztes']);
      app(App\\Actions\\Account\\DeleteAccount::class)->handle($user, $user);
    } catch (Throwable $e) { $threw = true; }
    $db::unprepared('DROP TRIGGER pw_block_oral');
    return [
      'threw' => $threw,
      'completionsLeft' => $db::table('lesson_completions')->where('user_id', $user->id)->count(),
      'oralLeft' => $db::table('oral_practices')->where('user_id', $user->id)->count(),
      'trashed' => App\\Models\\User::onlyTrashed()->whereKey($user->id)->exists(),
    ];
  `) as { threw: boolean; completionsLeft: number; oralLeft: number; trashed: boolean }
}

export interface AuditPruneResult {
  oldIp: string | null
  recentIp: string | null
  oldKept: boolean
  veryOldKept: boolean
  veryOldKeptWithPolicy: boolean
}

/**
 * PRIV-4: audit:prune. Harom sort ir (100 napos, ma, 3 eves) IP-vel, lefuttatja a parancsot
 * az alapbeallitassal, majd 1 eves torlesi korlattal.
 */
export function probeAuditPrune(): AuditPruneResult {
  return tinkerJson(`
    $db = Illuminate\\Support\\Facades\\DB::table('audit_logs');
    $make = fn ($days) => Illuminate\\Support\\Facades\\DB::table('audit_logs')->insertGetId(['action' => 'probe.prune', 'ip_address' => '203.0.113.7', 'created_at' => now()->subDays($days)]);
    $old = $make(100); $recent = $make(0); $veryOld = $make(1100);
    Illuminate\\Support\\Facades\\Artisan::call('audit:prune');
    $row = fn ($id) => Illuminate\\Support\\Facades\\DB::table('audit_logs')->where('id', $id)->first();
    $result = ['oldIp' => $row($old)?->ip_address, 'recentIp' => $row($recent)?->ip_address, 'oldKept' => $row($old) !== null, 'veryOldKept' => $row($veryOld) !== null];
    config(['privacy.audit_delete_after_years' => 1]);
    Illuminate\\Support\\Facades\\Artisan::call('audit:prune');
    $result['veryOldKeptWithPolicy'] = $row($veryOld) !== null;
    Illuminate\\Support\\Facades\\DB::table('audit_logs')->where('action', 'probe.prune')->delete();
    return $result;
  `) as AuditPruneResult
}

/** IpAnonymizer: csonkolt cimek. */
export function truncatedIps(): { v4: string | null; v6: string | null; bad: string | null } {
  return tinkerJson(`
    return ['v4' => App\\Support\\Privacy\\IpAnonymizer::truncate('192.168.5.77'), 'v6' => App\\Support\\Privacy\\IpAnonymizer::truncate('2001:db8:abcd:1234::1'), 'bad' => App\\Support\\Privacy\\IpAnonymizer::truncate('nem-ip')];
  `) as { v4: string | null; v6: string | null; bad: string | null }
}

/** PRIV-10: eles kornyezetben a jelszoszabaly ellenorzi a kiszivargott jelszavakat, egyebkent nem. */
export function uncompromisedRule(): { production: boolean; testing: boolean } {
  return tinkerJson(`
    $flag = function () { $rule = Illuminate\\Validation\\Rules\\Password::default(); $p = new ReflectionProperty(Illuminate\\Validation\\Rules\\Password::class, 'uncompromised'); return $p->getValue($rule); };
    $testing = $flag();
    app()->instance('env', 'production');
    $production = $flag();
    return ['production' => $production, 'testing' => $testing];
  `) as { production: boolean; testing: boolean }
}

/** A fiok torlese utan a felhasznalo audit soraiban (a torles sajat sorat kivéve) megmarado metaadatok. */
export function redactedMetadata(userId: number): unknown[] {
  const rows = auditRowsOf(userId).filter((row) => row.action !== 'account.deleted' && row.metadata !== null)
  return rows.map((row) => JSON.parse(row.metadata ?? 'null') as unknown)
}

/** Lecke-teljesitest ir a felhasznalonak (a vegpont a feladatok megoldasat varna). */
export function plantLessonCompletion(userId: number, lessonId: number): void {
  tinkerJson(`Illuminate\\Support\\Facades\\DB::table('lesson_completions')->insert(['user_id' => ${String(userId)}, 'lesson_id' => ${String(lessonId)}, 'completed_at' => now()]); return true;`)
}
