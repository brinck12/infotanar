<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Exams\EvaluateExamAttempt;
use App\Actions\Exams\SubmitExamAttempt;
use App\Enums\ExamAttemptState;
use App\Enums\ExamMode;
use App\Exceptions\FileTasks\EvaluatorBusy;
use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Models\ExamAttempt;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use RuntimeException;
use Throwable;

/**
 * Utemezett sweep (percenkent): lezarja es ertekeli a lejart vizsgahelyzetu
 * probalkozasokat (`deadline_at` + exams.grace_seconds elmult), azoknak a
 * diakoknak, akik bezartak a bongeszot; es ujraprobalja a `submitted`
 * allapotban ragadt probalkozasok ertekeleset. Egy futasban legfeljebb
 * exams.close_batch probalkozas, mindegyik sajat tranzakciojaban, hogy egy
 * hibas fajl ne akassza meg a tobbit.
 *
 * Az utemezes a routes/console.php-ben van.
 */
final class CloseExpiredExamAttempts implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    /** A beadott, de ertekeletlen probalkozast ennyi ideig hagyjuk, mielott a job ujraprobalja (a kerest ne zavarjuk). */
    private const STUCK_AFTER_SECONDS = 30;

    /** Ennyiszer probaljuk ujra egy elakadt ertekelest; utana jelezzuk, es hagyjuk. */
    private const MAX_FAILURES = 5;

    private const GAVE_UP_KEY = 'exams.evaluate_gave_up';

    public function handle(SubmitExamAttempt $submit, EvaluateExamAttempt $evaluate): void
    {
        $batch = max(1, Config::integer('exams.close_batch'));
        $now = CarbonImmutable::now();

        $expired = ExamAttempt::query()
            ->open()
            ->where('mode', ExamMode::Exam)
            ->whereNotNull('deadline_at')
            ->where('deadline_at', '<', $now->subSeconds(max(0, Config::integer('exams.grace_seconds'))))
            ->orderBy('id')
            ->limit($batch)
            ->get();

        foreach ($expired as $attempt) {
            $this->guard(static fn (): ExamAttempt => $submit->handle($attempt));
        }

        $gaveUp = self::gaveUp();

        $stuck = ExamAttempt::query()
            ->where('state', ExamAttemptState::Submitted)
            ->where('submitted_at', '<', $now->subSeconds(self::STUCK_AFTER_SECONDS))
            ->whereNotIn('id', $gaveUp)
            ->orderBy('id')
            ->limit($batch)
            ->get();

        foreach ($stuck as $attempt) {
            try {
                $evaluate->handle($attempt);
            } catch (EvaluatorBusy) {
                // Foglalt ertekelo: atmeneti, nem szamit a korlatba; a kovetkezo futas ujraprobalja.
            } catch (Throwable $exception) {
                report($exception);
                $this->recordFailure($attempt);
            }
        }
    }

    /** A feladott probalkozasok azonositoi (nem kerulnek vissza a jelolt listara, amig kezzel ertekelik). */
    /** @return list<int> */
    public static function gaveUp(): array
    {
        $ids = Cache::get(self::GAVE_UP_KEY);

        return is_array($ids) ? array_values(array_filter($ids, is_int(...))) : [];
    }

    /** A kezi ujraertekeles (exams:evaluate) utan: a szamlalo es a feladott jeloles torlese. */
    public static function forget(int $attemptId): void
    {
        Cache::forget(self::retryKey($attemptId));

        Cache::forever(self::GAVE_UP_KEY, array_values(array_diff(self::gaveUp(), [$attemptId])));
    }

    private static function retryKey(int $attemptId): string
    {
        return 'exams.evaluate_failures.'.$attemptId;
    }

    /** Valodi hibat szamol; a korlatnal naplozza, es leveszi a jeloltek kozul (kezzel: exams:evaluate). */
    private function recordFailure(ExamAttempt $attempt): void
    {
        $key = self::retryKey($attempt->id);
        $count = Cache::get($key);
        // A Redis cache a szamokat szamjegy-szovegkent adja vissza, ezert is_numeric, nem is_int.
        $count = (is_numeric($count) ? (int) $count : 0) + 1;
        Cache::forever($key, $count);

        if ($count >= self::MAX_FAILURES) {
            Cache::forever(self::GAVE_UP_KEY, array_values(array_unique([...self::gaveUp(), $attempt->id])));
            report(new RuntimeException("Vizsgaprobalkozas ertekelese ismetelten sikertelen (probalkozas: {$attempt->id}); kezi ujraertekeles: php artisan exams:evaluate {$attempt->id}"));
        }
    }

    /** @param callable(): mixed $work */
    private function guard(callable $work): void
    {
        try {
            $work();
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
