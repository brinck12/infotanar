<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Actions\Catalog\BuildTaskNavigation;
use App\Actions\Catalog\ListTasks;
use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\ListTasksRequest;
use App\Http\Resources\TaskResource;
use App\Http\Resources\TaskSummaryResource;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Progress\ExerciseStatuses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * v1 "tasks" = publikalt feladatok (exercises), a modul ("topic") adataival.
 * A vegpontok nyilvanosak; ervenyes token eseten a zarolas a felhasznalo
 * elofizetesehez igazodik.
 */
final class TaskController extends Controller
{
    public function __construct(private readonly ContentAccess $access) {}

    public function index(ListTasksRequest $request, ListTasks $listTasks): JsonResponse
    {
        $viewer = $this->viewer($request);
        $statuses = ExerciseStatuses::for($viewer);

        return response()->json([
            'data' => $listTasks->handle($request->filters(), $viewer)->map(fn (Exercise $exercise): TaskSummaryResource => new TaskSummaryResource(
                $exercise,
                $this->access->denialFor($viewer, $exercise->lesson),
                $statuses,
            )),
        ]);
    }

    public function show(Request $request, int $task, BuildTaskNavigation $buildNavigation): TaskResource
    {
        $exercise = Exercise::query()
            ->published()
            ->with([...ListTasks::WITH_TOPIC, 'visibleTestCases'])
            ->withCount('hiddenTestCases')
            ->findOrFail($task);

        $viewer = $this->viewer($request);

        return new TaskResource(
            $exercise,
            $this->access->denialFor($viewer, $exercise->lesson),
            $buildNavigation->handle($viewer, $exercise),
            ExerciseStatuses::for($viewer),
        );
    }

    /** Az elofizetest egyszer toltjuk be, hogy a lista ne kerdezze le feladatonkent (N+1). */
    private function viewer(Request $request): ?User
    {
        $user = $request->user('sanctum');

        return $user instanceof User ? $user->loadMissing(['liveSubscription', 'activeAccessGrant']) : null;
    }
}
