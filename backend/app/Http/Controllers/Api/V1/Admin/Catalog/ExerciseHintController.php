<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageExerciseHint;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\ExerciseHintRequest;
use App\Http\Requests\Admin\Catalog\ReorderRequest;
use App\Http\Resources\Admin\AdminExerciseHintResource;
use App\Models\Exercise;
use App\Models\ExerciseHint;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class ExerciseHintController extends Controller
{
    public function __construct(private readonly ManageExerciseHint $manage) {}

    public function index(Exercise $exercise): AnonymousResourceCollection
    {
        return AdminExerciseHintResource::collection($exercise->hints()->get());
    }

    public function store(ExerciseHintRequest $request, Exercise $exercise, #[CurrentUser] User $admin): JsonResponse
    {
        $hint = $this->manage->create($exercise, $request->body(), $admin);

        return AdminExerciseHintResource::make($hint)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function update(ExerciseHintRequest $request, ExerciseHint $hint, #[CurrentUser] User $admin): AdminExerciseHintResource
    {
        return AdminExerciseHintResource::make($this->manage->update($hint, $request->body(), $admin));
    }

    public function destroy(ExerciseHint $hint, #[CurrentUser] User $admin): Response
    {
        $this->manage->delete($hint, $admin);

        return response()->noContent();
    }

    public function reorder(ReorderRequest $request, Exercise $exercise, #[CurrentUser] User $admin): Response
    {
        $this->manage->reorder($exercise, $request->ids(), $admin);

        return response()->noContent();
    }
}
