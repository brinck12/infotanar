<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\ListTasksRequest;
use App\Http\Resources\TaskResource;
use App\Http\Resources\TaskSummaryResource;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Access\ContentAccess;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * v1 "tasks" = publikalt feladatok (exercises), a modul ("topic") adataival.
 * A vegpontok nyilvanosak; ervenyes token eseten a zarolas a felhasznalo
 * elofizetesehez igazodik.
 */
final class TaskController extends Controller
{
    private const WITH_TOPIC = ['lesson:id,module_id,is_free', 'lesson.module:id,title,slug'];

    public function __construct(private readonly ContentAccess $access) {}

    public function index(ListTasksRequest $request): JsonResponse
    {
        $user = $this->viewer($request);

        $exercises = Exercise::query()
            ->published()
            ->with(self::WITH_TOPIC)
            ->when($request->topicSlug(), static fn (Builder $query, string $slug) => $query
                ->whereHas('lesson.module', static fn (Builder $module) => $module->where('slug', $slug)))
            ->when($request->level(), static fn (Builder $query, string $level) => $query->where('level', $level))
            ->orderBy('difficulty')
            ->orderBy('title')
            ->get();

        return response()->json([
            'data' => $exercises->map(fn (Exercise $exercise): TaskSummaryResource => new TaskSummaryResource(
                $exercise,
                $this->access->denialFor($user, $exercise->lesson),
            )),
        ]);
    }

    public function show(Request $request, int $task): TaskResource
    {
        $exercise = Exercise::query()
            ->published()
            ->with([...self::WITH_TOPIC, 'visibleTestCases'])
            ->withCount('hiddenTestCases')
            ->findOrFail($task);

        return new TaskResource($exercise, $this->access->denialFor($this->viewer($request), $exercise->lesson));
    }

    /** Az elofizetest egyszer toltjuk be, hogy a lista ne kerdezze le feladatonkent (N+1). */
    private function viewer(Request $request): ?User
    {
        $user = $request->user('sanctum');

        return $user instanceof User ? $user->loadMissing('liveSubscription') : null;
    }
}
