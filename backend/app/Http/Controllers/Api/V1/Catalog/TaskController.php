<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\ListTasksRequest;
use App\Http\Resources\TaskResource;
use App\Http\Resources\TaskSummaryResource;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class TaskController extends Controller
{
    public function index(ListTasksRequest $request): AnonymousResourceCollection
    {
        $tasks = Task::query()
            ->published()
            ->with('topic:id,name,slug')
            ->when($request->topicSlug(), static fn (Builder $query, string $slug) => $query
                ->whereHas('topic', static fn (Builder $topic) => $topic->where('slug', $slug)))
            ->when($request->level(), static fn (Builder $query, string $level) => $query->where('level', $level))
            ->orderBy('difficulty')
            ->orderBy('title')
            ->get();

        return TaskSummaryResource::collection($tasks);
    }

    public function show(int $task): TaskResource
    {
        $model = Task::query()
            ->published()
            ->with(['topic:id,name,slug', 'visibleTestCases'])
            ->withCount('hiddenTestCases')
            ->findOrFail($task);

        return TaskResource::make($model);
    }
}
