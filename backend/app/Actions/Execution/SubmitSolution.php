<?php

declare(strict_types=1);

namespace App\Actions\Execution;

use App\Actions\Progress\RecordLessonProgress;
use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\Execution\ExecutionCapacityExhausted;
use App\Models\Exercise;
use App\Models\Submission;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Execution\EvaluationResult;
use App\Services\Execution\ExecutionCapacity;
use App\Services\Execution\SubmissionOutcome;
use App\Services\SolutionEvaluator;

/** "Beadas": minden teszteseten fut (a rejtetteken is), az eredmeny mentodik. */
final readonly class SubmitSolution
{
    public function __construct(
        private SolutionEvaluator $evaluator,
        private ContentAccess $access,
        private RecordLessonProgress $recordLessonProgress,
        private ExecutionCapacity $capacity,
    ) {}

    /**
     * @throws PremiumContentLocked
     * @throws ExecutionCapacityExhausted
     */
    public function handle(Exercise $exercise, string $language, string $sourceCode, ?User $user): SubmissionOutcome
    {
        // A rejtett tesztesetek a fizetos tartalom resze: jogosultsag nelkul be sem adhato.
        $denial = $this->access->denialFor($user, $exercise->lesson);
        if ($denial !== null) {
            throw new PremiumContentLocked($denial);
        }

        // Elobb a kiertekeles (a helyfoglalas itt dol el), csak utana jon a sor: telt
        // kapacitasnal ne maradjon "running" allapotu beadas.
        $result = $this->capacity->run(fn (): EvaluationResult => $this->evaluator->evaluate($exercise, $language, $sourceCode, $exercise->testCases()->get()));

        $submission = Submission::create([
            'user_id' => $user?->id,
            'exercise_id' => $exercise->id,
            'language' => $language,
            'source_code' => $sourceCode,
            'status' => $result->status,
            'verdict' => $result->verdict,
            'results' => $result->results,
            'score' => $result->score,
            'max_score' => $result->maxScore,
            // Megjegyzesek nelkul: azok a teszteset elvart kimenetebol ideznek.
            'subtasks' => $result->storedSubtasks(),
        ]);

        // Haladas csak bejelentkezett felhasznalonak es csak elfogadott beadasra.
        $lessonCompleted = $user !== null
            && $result->status === 'passed'
            && $this->recordLessonProgress->handle($user, $exercise->lesson);

        return new SubmissionOutcome($submission, $lessonCompleted, $result->violations, $result->subtasks);
    }
}
