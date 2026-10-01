<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageExerciseSolution;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\ExerciseSolutionRequest;
use App\Http\Resources\Admin\AdminExerciseSolutionResource;
use App\Models\Exercise;
use App\Models\ExerciseSolution;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class ExerciseSolutionController extends Controller
{
    public function __construct(private readonly ManageExerciseSolution $manage) {}

    public function index(Exercise $exercise): AnonymousResourceCollection
    {
        return AdminExerciseSolutionResource::collection($exercise->solutions()->get());
    }

    /** Nyelvenkent egy megoldas van: a PUT letrehoz (201) vagy lecserel (200). */
    public function update(ExerciseSolutionRequest $request, Exercise $exercise, string $language, #[CurrentUser] User $admin): JsonResponse
    {
        $solution = $this->manage->save($exercise, $language, $request->sourceCode(), $request->explanation(), $admin);

        return AdminExerciseSolutionResource::make($solution)
            ->response()
            ->setStatusCode($solution->wasRecentlyCreated ? JsonResponse::HTTP_CREATED : JsonResponse::HTTP_OK);
    }

    public function destroy(ExerciseSolution $solution, #[CurrentUser] User $admin): Response
    {
        $this->manage->delete($solution, $admin);

        return response()->noContent();
    }
}
