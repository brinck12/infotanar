<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RunCodeRequest;
use App\Models\Task;
use App\Services\TaskEvaluator;
use Illuminate\Http\JsonResponse;

class RunController extends Controller
{
    public function __construct(private readonly TaskEvaluator $evaluator)
    {
    }

    /**
     * "Futtatas" gomb: csak a NEM rejtett teszteseteken fut, nem menti el.
     */
    public function __invoke(RunCodeRequest $request): JsonResponse
    {
        $task = Task::findOrFail($request->integer('task_id'));
        abort_unless($task->is_published, 404);

        $testCases = $task->visibleTestCases()->get();

        if ($testCases->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ehhez a feladathoz nincs nyilvanos teszteset, hasznald a Beadas gombot.',
                'results' => [],
            ], 422);
        }

        $outcome = $this->evaluator->evaluate(
            $task,
            $request->string('language')->toString(),
            $request->string('source_code')->toString(),
            $testCases
        );

        return response()->json($outcome);
    }
}
