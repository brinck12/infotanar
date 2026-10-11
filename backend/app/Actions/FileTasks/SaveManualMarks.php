<?php

declare(strict_types=1);

namespace App\Actions\FileTasks;

use App\Actions\Progress\RecordLessonProgress;
use App\Enums\ExamAttemptState;
use App\Enums\FileSubmissionStatus;
use App\Exceptions\FileTasks\ManualMarkRefused;
use App\Models\FileSubmission;
use App\Models\User;
use App\Services\Exams\ExamResultRecalculator;
use App\Services\FileTasks\ResultSnapshot;
use Illuminate\Support\Facades\DB;

/**
 * A diak megjeloli a kezi pontokat a sajat beadasan: o veti ossze a munkajat
 * a mintaval, tanari sor nincs (BACKEND.md 8.8). A jeloles barmikor
 * modosithato; a pontszam, a csoportok es a megoldottsag vele egyutt valtozik.
 *
 * Zarolt soron dolgozik, hogy ket egyszerre erkezo jeloles ne irja felul
 * egymast. Vizsgaban feltoltott fajlnal a vizsga eredmenye is ujraszamolodik;
 * gyakorlo beadasnal a megoldotta valas a lecke teljesiteset is rogzitheti.
 */
final readonly class SaveManualMarks
{
    public function __construct(
        private ExamResultRecalculator $examResults,
        private RecordLessonProgress $recordLessonProgress,
    ) {}

    /**
     * @param  User  $user  a beadas tulajdonosa (a jogosultsagot a hivo ellenorizte)
     * @param  array<int, bool>  $marks  ertekelolap-pont azonositoja => megvan-e
     *
     * @throws ManualMarkRefused ha a beadas nem jelolheto, vagy egy tetel nem a kezi pontja
     */
    public function handle(User $user, FileSubmission $submission, array $marks): FileSubmission
    {
        return DB::transaction(function () use ($user, $submission, $marks): FileSubmission {
            $locked = FileSubmission::query()
                ->with(['exercise.lesson', 'examAttempt'])
                ->lockForUpdate()
                ->findOrFail($submission->id);

            $attempt = $locked->examAttempt;

            if ($attempt !== null && $attempt->state !== ExamAttemptState::Evaluated) {
                throw ManualMarkRefused::examNotSubmitted();
            }

            if ($locked->status !== FileSubmissionStatus::Evaluated) {
                throw ManualMarkRefused::notEvaluated();
            }

            $snapshot = ResultSnapshot::fromArray($locked->result);

            foreach (array_keys($marks) as $rubricItemId) {
                if (! $snapshot->hasManualItem($rubricItemId)) {
                    throw ManualMarkRefused::notManualItem();
                }
            }

            $wasPassed = $locked->passed;
            $marked = $snapshot->withMarks($marks);

            $locked->result = $marked->toArray();
            $locked->score = $marked->score();
            $locked->max_score = $marked->maxScore();
            $locked->passed = $marked->passed();
            $locked->save();

            if ($attempt !== null) {
                // Vizsgasor: a haladasba nem szamit, de a vizsga pontszama es a fuggo kezi pontok kovetik.
                $this->examResults->recompute($attempt);
            } elseif ($locked->passed && ! $wasPassed) {
                $this->recordLessonProgress->handle($user, $locked->exercise->lesson);
            }

            return $locked;
        });
    }
}
