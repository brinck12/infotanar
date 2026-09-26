<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TestCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /** Lista-nezet: leiras nelkul, temakor es szint szerint szurhetoen. */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => ['sometimes', 'string'],
            'level' => ['sometimes', 'string', 'in:kozep,emelt'],
        ]);

        $tasks = Task::query()
            ->published()
            ->with('topic:id,name,slug')
            ->when(
                isset($validated['topic']),
                fn ($q) => $q->whereHas('topic', fn ($t) => $t->where('slug', $validated['topic']))
            )
            ->when(isset($validated['level']), fn ($q) => $q->where('level', $validated['level']))
            ->orderBy('difficulty')
            ->orderBy('title')
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'level' => $task->level,
                'difficulty' => $task->difficulty,
                'allowed_languages' => $task->allowed_languages,
                'topic' => [
                    'id' => $task->topic->id,
                    'name' => $task->topic->name,
                    'slug' => $task->topic->slug,
                ],
            ]);

        return response()->json(['data' => $tasks]);
    }

    /** Reszletes nezet: teljes leiras, starter_code es a NEM rejtett tesztesetek. */
    public function show(Task $task): JsonResponse
    {
        abort_unless($task->is_published, 404);

        $task->load('topic:id,name,slug', 'visibleTestCases');

        return response()->json([
            'data' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'level' => $task->level,
                'difficulty' => $task->difficulty,
                'allowed_languages' => $task->allowed_languages,
                'starter_code' => $task->starter_code ?? new \stdClass(),
                'topic' => [
                    'id' => $task->topic->id,
                    'name' => $task->topic->name,
                    'slug' => $task->topic->slug,
                ],
                'example_test_cases' => $task->visibleTestCases->map(fn (TestCase $tc): array => [
                    'id' => $tc->id,
                    'stdin' => (string) $tc->stdin,
                    'expected_stdout' => $tc->expected_stdout,
                ])->values(),
                'hidden_test_case_count' => $task->testCases()->where('is_hidden', true)->count(),
            ],
        ]);
    }
}
