<?php

declare(strict_types=1);

namespace App\Actions\Execution;

use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\Execution\ExecutionCapacityExhausted;
use App\Exceptions\Execution\NoVisibleTestCases;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Execution\EvaluationResult;
use App\Services\Execution\ExecutionCapacity;
use App\Services\SolutionEvaluator;

/** "Futtatas": csak a nyilvanos teszteseteken fut, semmit nem ment. */
final readonly class RunSolution
{
    public function __construct(
        private SolutionEvaluator $evaluator,
        private ContentAccess $access,
        private ExecutionCapacity $capacity,
    ) {}

    /**
     * @throws PremiumContentLocked
     * @throws NoVisibleTestCases
     * @throws ExecutionCapacityExhausted
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

        return $this->capacity->run(fn (): EvaluationResult => $this->evaluator->evaluate($exercise, $language, $sourceCode, $testCases));
    }
}
