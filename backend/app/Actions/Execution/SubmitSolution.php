<?php

declare(strict_types=1);

namespace App\Actions\Execution;

use App\Exceptions\Access\PremiumContentLocked;
use App\Models\Exercise;
use App\Models\Submission;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\SolutionEvaluator;

/** "Beadas": minden teszteseten fut (a rejtetteken is), az eredmeny mentodik. */
final readonly class SubmitSolution
{
    public function __construct(
        private SolutionEvaluator $evaluator,
        private ContentAccess $access,
    ) {}

    /** @throws PremiumContentLocked */
    public function handle(Exercise $exercise, string $language, string $sourceCode, ?User $user): Submission
    {
        // A rejtett tesztesetek a fizetos tartalom resze: jogosultsag nelkul be sem adhato.
        $denial = $this->access->denialFor($user, $exercise->lesson);
        if ($denial !== null) {
            throw new PremiumContentLocked($denial);
        }

        $submission = Submission::create([
            'user_id' => $user?->id,
            'exercise_id' => $exercise->id,
            'language' => $language,
            'source_code' => $sourceCode,
            'status' => 'running',
        ]);

        $result = $this->evaluator->evaluate($language, $sourceCode, $exercise->testCases()->get());

        $submission->update([
            'status' => $result->status,
            'results' => $result->results,
        ]);

        return $submission;
    }
}
