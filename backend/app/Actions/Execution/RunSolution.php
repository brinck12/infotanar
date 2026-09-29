<?php

declare(strict_types=1);

namespace App\Actions\Execution;

use App\Exceptions\Execution\NoVisibleTestCases;
use App\Models\Task;
use App\Services\Execution\EvaluationResult;
use App\Services\TaskEvaluator;

/** "Futtatas": csak a nyilvanos teszteseteken fut, semmit nem ment. */
final readonly class RunSolution
{
    public function __construct(private TaskEvaluator $evaluator) {}

    /** @throws NoVisibleTestCases */
    public function handle(Task $task, string $language, string $sourceCode): EvaluationResult
    {
        $testCases = $task->visibleTestCases()->get();

        if ($testCases->isEmpty()) {
            throw new NoVisibleTestCases;
        }

        return $this->evaluator->evaluate($language, $sourceCode, $testCases);
    }
}
