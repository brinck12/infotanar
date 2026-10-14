<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Exams\SubmitExamAttempt;
use App\Enums\ExamMode;
use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Models\ExamAttempt;
use App\Services\Exams\AttemptView;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Config;
use Throwable;

/**
 * Utemezett sweep (orankent): az exams.idle_days napja tetlen, nyitott
 * gyakorlo probalkozasokat lezarja. Amelyikben van feltoltes vagy ervenyes
 * kodbeadas, azt beadja es ertekeli; az uresset torli.
 *
 * Az utemezes a routes/console.php-ben van.
 */
final class PruneIdleExamAttempts implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    private const CHUNK = 50;

    public function handle(SubmitExamAttempt $submit, AttemptView $view): void
    {
        $cutoff = CarbonImmutable::now()->subDays(max(1, Config::integer('exams.idle_days')));

        ExamAttempt::query()
            ->open()
            ->where('mode', ExamMode::Practice)
            ->where('last_activity_at', '<', $cutoff)
            ->chunkById(self::CHUNK, function (Collection $attempts) use ($submit, $view): void {
                foreach ($attempts as $attempt) {
                    try {
                        if ($view->one($attempt)->parts === []) {
                            // Semmi nincs benne: nincs mit megorizni, es a nyitott jelolo sem marad az utban.
                            $attempt->delete();
                        } else {
                            $submit->handle($attempt);
                        }
                    } catch (Throwable $exception) {
                        report($exception);
                    }
                }
            });
    }
}
