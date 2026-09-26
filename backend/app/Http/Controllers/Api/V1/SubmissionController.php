<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RunCodeRequest;
use App\Models\Submission;
use App\Models\Task;
use App\Services\TaskEvaluator;
use Illuminate\Http\JsonResponse;

class SubmissionController extends Controller
{
    public function __construct(private readonly TaskEvaluator $evaluator)
    {
    }

    /**
     * "Beadas" gomb: MINDEN teszteseten fut, es elmentjuk az eredmenyt.
     */
    public function store(RunCodeRequest $request): JsonResponse
    {
        $task = Task::findOrFail($request->integer('task_id'));
        abort_unless($task->is_published, 404);

        $submission = Submission::create([
            'task_id' => $task->id,
            'language' => $request->string('language')->toString(),
            'source_code' => $request->string('source_code')->toString(),
            'status' => 'running',
        ]);

        $outcome = $this->evaluator->evaluate(
            $task,
            $submission->language,
            $submission->source_code,
            $task->testCases()->get()
        );

        $submission->update([
            'status' => $outcome['status'],
            'results' => $outcome['results'],
        ]);

        return response()->json([
            'submission_id' => $submission->id,
            'status' => $outcome['status'],
            'results' => $outcome['results'],
        ]);
    }
}
