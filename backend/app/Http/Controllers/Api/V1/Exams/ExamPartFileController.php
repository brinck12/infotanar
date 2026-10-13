<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Exams;

use App\Actions\Exams\UploadExamPartFile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Exams\UploadExamPartFileRequest;
use App\Http\Resources\Exams\ExamAttemptResource;
use App\Models\User;
use App\Services\Exams\AttemptClock;
use App\Services\Exams\AttemptView;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

/** Fajl feltoltese egy vizsgareszhez; a valasz az egesz probalkozas frissitett allapota. */
final class ExamPartFileController extends Controller
{
    public function store(
        UploadExamPartFileRequest $request,
        #[CurrentUser] User $user,
        UploadExamPartFile $upload,
        AttemptView $view,
        AttemptClock $clock,
    ): JsonResponse {
        $attempt = $upload->handle($user, $request->attempt(), $request->part(), $request->upload());

        return (new ExamAttemptResource($view->one($attempt), $clock->now()))->response();
    }
}
