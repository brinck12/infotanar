<?php

declare(strict_types=1);

namespace App\Actions\Execution;

use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\Execution\NoVisibleTestCases;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Execution\EvaluationResult;
use App\Services\SolutionEvaluator;

/** "Futtatas": csak a nyilvanos teszteseteken fut, semmit nem ment. */
final readonly class RunSolution
{
    public function __construct(
        private SolutionEvaluator $evaluator,
        private ContentAccess $access,
    ) {}

    /**
     * @throws PremiumContentLocked
     * @throws NoVisibleTestCases
     */
    public function handle(Exercise $exercise, string $language, string $sourceCode, ?User $user): EvaluationResult
    {
        $denial = $this->access->denialFor($user, $exercise->lesson);
        if ($denial !== null) {
            throw new PremiumContentLocked($denial);
        }

        $testCases = $exercise->visibleTestCases()->get();

        if ($testCases->isEmpty()) {
            throw new NoVisibleTestCases;
        }

        return $this->evaluator->evaluate($language, $sourceCode, $testCases);
    }
}
