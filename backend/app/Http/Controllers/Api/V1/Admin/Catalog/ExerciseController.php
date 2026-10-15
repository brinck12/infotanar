<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\CreateExercise;
use App\Actions\Admin\Catalog\DeleteExercise;
use App\Actions\Admin\Catalog\UpdateExercise;
use App\Exceptions\Catalog\CatalogItemInUse;
use App\Exceptions\Catalog\ExerciseKindLocked;
use App\Exceptions\Catalog\ExerciseNotPublishable;
use App\Exceptions\Catalog\ExerciseUsedByExam;
use App\Exceptions\Catalog\PublishedExerciseNeedsRubric;
use App\Exceptions\Catalog\PublishedExerciseNeedsSpec;
use App\Exceptions\Catalog\PublishedExerciseNeedsVisibleTestCase;
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
    /** A lista es a reszletes nezet szamlaloi. */
    private const COUNTS = ['testCases', 'submissions', 'fileSubmissions', 'rubricItems'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $exercises = Exercise::query()
            ->withCount(self::COUNTS)
            ->when($request->integer('lesson_id'), static fn ($q, int $lessonId) => $q->where('lesson_id', $lessonId))
            ->orderBy('lesson_id')
            ->orderBy('position')
            ->get();

        return AdminExerciseResource::collection($exercises);
    }

    /** A csatolt fajlok csak itt jonnek: a lista feladatonkent alairt URL-eket gyartana. */
    public function show(Exercise $exercise): AdminExerciseResource
    {
        return AdminExerciseResource::make($exercise->loadCount(self::COUNTS)->load('attachments'));
    }

    /**
     * @throws PublishedExerciseNeedsVisibleTestCase
     * @throws PublishedExerciseNeedsSpec
     * @throws PublishedExerciseNeedsRubric
     * @throws ExerciseNotPublishable
     */
    public function store(ExerciseRequest $request, CreateExercise $create, #[CurrentUser] User $admin): JsonResponse
    {
        $exercise = $create->handle($request->exerciseAttributes(), $admin);

        return AdminExerciseResource::make($exercise)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    /**
     * @throws ExerciseKindLocked
     * @throws PublishedExerciseNeedsVisibleTestCase
     * @throws PublishedExerciseNeedsSpec
     * @throws PublishedExerciseNeedsRubric
     * @throws ExerciseNotPublishable
     */
    public function update(ExerciseRequest $request, Exercise $exercise, UpdateExercise $update, #[CurrentUser] User $admin): AdminExerciseResource
    {
        return AdminExerciseResource::make($update->handle($exercise, $request->exerciseAttributes(), $admin));
    }

    /**
     * @throws CatalogItemInUse
     * @throws ExerciseUsedByExam
     */
    public function destroy(Exercise $exercise, DeleteExercise $delete, #[CurrentUser] User $admin): Response
    {
        $delete->handle($exercise, $admin);

        return response()->noContent();
    }
}
