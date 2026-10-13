<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Exams\EvaluateExamAttempt;
use App\Actions\Exams\SubmitExamAttempt;
use App\Enums\ExamAttemptState;
use App\Enums\ExamMode;
use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Models\ExamAttempt;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Config;
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
    private const STUCK_AFTER_MINUTES = 2;

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

        $stuck = ExamAttempt::query()
            ->where('state', ExamAttemptState::Submitted)
            ->where('submitted_at', '<', $now->subMinutes(self::STUCK_AFTER_MINUTES))
            ->orderBy('id')
            ->limit($batch)
            ->get();

        foreach ($stuck as $attempt) {
            $this->guard(static fn (): ExamAttempt => $evaluate->handle($attempt));
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
