<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageExerciseFile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\ExerciseFileRequest;
use App\Http\Resources\Admin\AdminExerciseFileResource;
use App\Models\Exercise;
use App\Models\ExerciseFile;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class ExerciseFileController extends Controller
{
    public function __construct(private readonly ManageExerciseFile $manage) {}

    public function index(Exercise $exercise): AnonymousResourceCollection
    {
        return AdminExerciseFileResource::collection($exercise->files()->get());
    }

    /** 201 uj fajlnal, 200 ha egy meglevo azonos nevu fajlt cserelt le. */
    public function store(ExerciseFileRequest $request, Exercise $exercise, #[CurrentUser] User $admin): JsonResponse
    {
        $file = $this->manage->store($exercise, $request->upload(), $request->fileName(), $request->testCaseId(), $admin);

        return AdminExerciseFileResource::make($file)
            ->response()
            ->setStatusCode($file->wasRecentlyCreated ? JsonResponse::HTTP_CREATED : JsonResponse::HTTP_OK);
    }

    public function destroy(ExerciseFile $exerciseFile, #[CurrentUser] User $admin): Response
    {
        $this->manage->delete($exerciseFile, $admin);

        return response()->noContent();
    }
}
