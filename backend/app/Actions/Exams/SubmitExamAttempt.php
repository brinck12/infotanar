<?php

declare(strict_types=1);

namespace App\Actions\Exams;

use App\Enums\ExamAttemptState;
use App\Models\ExamAttempt;
use App\Services\Exams\AttemptClock;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * A probalkozas beadasa es azonnali ertekelese. Mind a harom lezarasi ut
 * (a kliens automatikus beadasa, a lusta lejarat a lekeresnel/feltoltesnel,
 * az utemezett job) ezt hivja.
 *
 * Idempotens: a mar beadott probalkozast nem modositja (masodik lap, ketszer
 * kuldott keres). Ha az ertekeles elhasal, a probalkozas `submitted` marad,
 * az eredmeny vegpont 409-et ad, es a job ujraprobalja.
 */
final readonly class SubmitExamAttempt
{
    public function __construct(
        private AttemptClock $clock,
        private EvaluateExamAttempt $evaluate,
    ) {}

    public function handle(ExamAttempt $attempt): ExamAttempt
    {
        $current = DB::transaction(function () use ($attempt): ExamAttempt {
            $locked = ExamAttempt::query()->lockForUpdate()->findOrFail($attempt->id);

            if ($locked->state === ExamAttemptState::InProgress) {
                $locked->state = ExamAttemptState::Submitted;
                $locked->submitted_at = CarbonImmutable::now();
                $locked->in_progress_marker = null;
                $locked->save();
            }

            return $locked;
        });

        // A beadott, de meg nem ertekelt probalkozas (egy korabbi hiba utan) itt ujra megprobalkozik.
        return $current->state === ExamAttemptState::Submitted ? $this->tryEvaluate($current) : $current;
    }

    /**
     * Ha a probalkozas vizsgahelyzetben lejart (hatarido + turelmi ido), beadja
     * es ertekeli; kulonben valtozatlanul adja vissza.
     */
    public function closeIfExpired(ExamAttempt $attempt): ExamAttempt
    {
        if ($attempt->isOpen() && $attempt->mode->isTimed() && $this->clock->isExpired($attempt)) {
            return $this->handle($attempt);
        }

        return $attempt;
    }

    private function tryEvaluate(ExamAttempt $attempt): ExamAttempt
    {
        try {
            return $this->evaluate->handle($attempt);
        } catch (Throwable $exception) {
            // A beadas megtortent; az ertekelest a job ujraprobalja, a diak ezalatt 409-et kap az eredmenyre.
            report($exception);

            return $attempt->refresh();
        }
    }
}
