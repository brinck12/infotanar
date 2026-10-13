<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Exams\EvaluateExamAttempt;
use App\Enums\ExamAttemptState;
use App\Jobs\CloseExpiredExamAttempts;
use App\Models\ExamAttempt;
use Illuminate\Console\Command;
use Throwable;

/**
 * Kezi ujraertekeles egy beadott, de ertekeletlen vizsgaprobalkozasra, miutan a
 * CloseExpiredExamAttempts feladta (lasd a naplot: "Vizsgaprobalkozas ertekelese
 * ismetelten sikertelen"). Sikeres futas utan a job ujra nem foglalkozik vele.
 *
 *   php artisan exams:evaluate 123
 */
final class EvaluateExamAttemptCommand extends Command
{
    protected $signature = 'exams:evaluate {attempt : A vizsgaprobalkozas azonosítója}';

    protected $description = 'Beadott, de ertekeletlen vizsgaprobalkozas ujraertekelese';

    public function handle(EvaluateExamAttempt $evaluate): int
    {
        $attempt = ExamAttempt::query()->find((int) $this->argument('attempt'));

        if ($attempt === null || $attempt->state !== ExamAttemptState::Submitted) {
            $this->error('Nincs ilyen beadott, ertekeletlen probalkozas.');

            return self::FAILURE;
        }

        try {
            $evaluate->handle($attempt);
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        CloseExpiredExamAttempts::forget($attempt->id);
        $this->info('Kiértékelve.');

        return self::SUCCESS;
    }
}
