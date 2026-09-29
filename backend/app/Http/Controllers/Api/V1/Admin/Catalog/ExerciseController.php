<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageCatalogItem;
use App\Exceptions\Catalog\CatalogItemInUse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\ExerciseRequest;
use App\Http\Resources\Admin\AdminExerciseResource;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class ExerciseController extends Controller
{
    private const PARENT = 'lesson_id';

    public function __construct(private readonly ManageCatalogItem $manage) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $exercises = Exercise::query()
            ->withCount(['testCases', 'submissions'])
            ->when($request->integer('lesson_id'), static fn ($q, int $lessonId) => $q->where('lesson_id', $lessonId))
            ->orderBy('lesson_id')
            ->orderBy('position')
            ->get();

        return AdminExerciseResource::collection($exercises);
    }

    public function show(Exercise $exercise): AdminExerciseResource
    {
        return AdminExerciseResource::make($exercise->loadCount(['testCases', 'submissions']));
    }

    public function store(ExerciseRequest $request, #[CurrentUser] User $admin): JsonResponse
    {
        $exercise = $this->manage->create(new Exercise($request->validated()), self::PARENT, $admin);

        return AdminExerciseResource::make($exercise)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function update(ExerciseRequest $request, Exercise $exercise, #[CurrentUser] User $admin): AdminExerciseResource
    {
        return AdminExerciseResource::make($this->manage->update($exercise, $request->validated(), self::PARENT, $admin));
    }

    /**
     * A beadasok (es rajtuk keresztul a haladas) a feladathoz kotottek: ha
     * mar van, a torles helyett rejteni kell.
     *
     * @throws CatalogItemInUse
     */
    public function destroy(Exercise $exercise, #[CurrentUser] User $admin): Response
    {
        if ($exercise->submissions()->exists()) {
            throw CatalogItemInUse::hasStudentData();
        }

        $this->manage->delete($exercise, self::PARENT, $admin);

        return response()->noContent();
    }
}
