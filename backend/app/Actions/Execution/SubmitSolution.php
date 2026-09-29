<?php

declare(strict_types=1);

namespace App\Actions\Execution;

use App\Models\Submission;
use App\Models\Task;
use App\Models\User;
use App\Services\TaskEvaluator;

/** "Beadas": minden teszteseten fut, az eredmeny mentodik. */
final readonly class SubmitSolution
{
    public function __construct(private TaskEvaluator $evaluator) {}

    public function handle(Task $task, string $language, string $sourceCode, ?User $user): Submission
    {
        $submission = Submission::create([
            'user_id' => $user?->id,
            'task_id' => $task->id,
            'language' => $language,
            'source_code' => $sourceCode,
            'status' => 'running',
        ]);

        $result = $this->evaluator->evaluate($language, $sourceCode, $task->testCases()->get());

        $submission->update([
            'status' => $result->status,
            'results' => $result->results,
        ]);

        return $submission;
    }
}
