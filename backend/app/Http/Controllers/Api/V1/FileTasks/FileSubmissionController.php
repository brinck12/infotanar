<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\FileTasks;

use App\Actions\FileTasks\SaveManualMarks;
use App\Actions\FileTasks\SubmitFileSolution;
use App\Http\Controllers\Controller;
use App\Http\Requests\FileTasks\SaveManualMarksRequest;
use App\Http\Requests\FileTasks\UploadFileSubmissionRequest;
use App\Http\Resources\FileSubmissionResource;
use App\Models\Exercise;
use App\Models\FileSubmission;
use App\Models\User;
use App\Services\Files\FileDisk;
use App\Services\Files\PrivateFileStore;
use App\Services\Files\StoredFile;
use App\Services\FileTasks\FileSubmissionPresenter;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Fajlbeadasok: feltoltes es szinkron ertekeles, a diak sajat probalkozasai,
 * a kezi pontok jelolese es a feltoltott kep elonezete.
 *
 * A beadas a diak sajat munkaja: akkor is olvashato marad, ha a feladat
 * kozben zarolt lett neki (lejart elofizetes). Mas beadasa 404, igy a
 * letezese sem derul ki.
 */
final class FileSubmissionController extends Controller
{
    /** Egy feladat listajaban legfeljebb ennyi probalkozas jelenik meg. */
    private const HISTORY_LIMIT = 50;

    public function __construct(private readonly FileSubmissionPresenter $presenter) {}

    /** A diak gyakorlo probalkozasai a feladathoz, a legujabb elol. Vizsgaban feltoltott fajl nincs koztuk. */
    public function index(#[CurrentUser] User $user, int $exercise): AnonymousResourceCollection
    {
        $model = Exercise::query()->published()->with('lesson')->findOrFail($exercise);

        return FileSubmissionResource::collection($this->presenter->history($user, $model, self::HISTORY_LIMIT));
    }

    public function store(UploadFileSubmissionRequest $request, #[CurrentUser] User $user, SubmitFileSolution $submit): JsonResponse
    {
        $submission = $submit->handle($user, $request->exercise(), $request->upload());

        return FileSubmissionResource::make($this->presenter->one($submission, $user))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function show(#[CurrentUser] User $user, int $submission): FileSubmissionResource
    {
        $model = $this->find($submission);
        abort_unless($user->can('view', $model), 404);

        return FileSubmissionResource::make($this->presenter->one($model, $user));
    }

    public function manual(SaveManualMarksRequest $request, #[CurrentUser] User $user, int $submission, SaveManualMarks $save): FileSubmissionResource
    {
        $model = $this->find($submission);
        abort_unless($user->can('mark', $model), 404);

        return FileSubmissionResource::make($this->presenter->one($save->handle($user, $model, $request->marks()), $user));
    }

    /**
     * A feltoltott kep (png, svg) alairt URL-en at, az elonezethez. Token nem
     * kell hozza: az <img src> nem tud fejlecet kuldeni, a jogosultsagot az
     * alairas hordozza. Mas tipusu feltoltest ez a vegpont soha nem ad ki.
     */
    public function file(int $submission, PrivateFileStore $files): Response
    {
        $model = FileSubmission::query()->findOrFail($submission);
        $mime = FileSubmissionPresenter::PREVIEW_MIME[$model->extension] ?? throw new NotFoundHttpException;

        try {
            return $files->response(
                new StoredFile(FileDisk::SubmissionFiles, $model->path, $model->original_name, $model->extension, $model->size, $model->sha256, $mime),
                inline: true,
            );
        } catch (FileNotFoundException) {
            throw new NotFoundHttpException;
        }
    }

    private function find(int $id): FileSubmission
    {
        return FileSubmission::query()->with('exercise.lesson')->findOrFail($id);
    }
}
