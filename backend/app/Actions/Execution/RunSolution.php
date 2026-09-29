<?php

declare(strict_types=1);

namespace App\Actions\Execution;

use App\Exceptions\Execution\NoVisibleTestCases;
use App\Models\Exercise;
use App\Services\Execution\EvaluationResult;
use App\Services\SolutionEvaluator;

/** "Futtatas": csak a nyilvanos teszteseteken fut, semmit nem ment. */
final readonly class RunSolution
{
    public function __construct(private SolutionEvaluator $evaluator) {}

    /** @throws NoVisibleTestCases */
    public function handle(Exercise $exercise, string $language, string $sourceCode): EvaluationResult
    {
        $testCases = $exercise->visibleTestCases()->get();

        if ($testCases->isEmpty()) {
            throw new NoVisibleTestCases;
        }

        return $this->evaluator->evaluate($language, $sourceCode, $testCases);
    }
}
