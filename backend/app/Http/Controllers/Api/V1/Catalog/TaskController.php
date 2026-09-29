<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\ListTasksRequest;
use App\Http\Resources\TaskResource;
use App\Http\Resources\TaskSummaryResource;
use App\Models\Exercise;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** v1 "tasks" = publikalt feladatok (exercises), a modul ("topic") adataival. */
final class TaskController extends Controller
{
    private const WITH_TOPIC = ['lesson:id,module_id,is_free', 'lesson.module:id,title,slug'];

    public function index(ListTasksRequest $request): AnonymousResourceCollection
    {
        $exercises = Exercise::query()
            ->published()
            ->with(self::WITH_TOPIC)
            ->when($request->topicSlug(), static fn (Builder $query, string $slug) => $query
                ->whereHas('lesson.module', static fn (Builder $module) => $module->where('slug', $slug)))
            ->when($request->level(), static fn (Builder $query, string $level) => $query->where('level', $level))
            ->orderBy('difficulty')
            ->orderBy('title')
            ->get();

        return TaskSummaryResource::collection($exercises);
    }

    public function show(int $task): TaskResource
    {
        $exercise = Exercise::query()
            ->published()
            ->with([...self::WITH_TOPIC, 'visibleTestCases'])
            ->withCount('hiddenTestCases')
            ->findOrFail($task);

        return TaskResource::make($exercise);
    }
}
