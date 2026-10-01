<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Progress;

use App\Actions\Progress\CompleteTheoryLesson;
use App\Enums\LessonProgressStatus;
use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

final class LessonCompletionController extends Controller
{
    /** Idempotens: mar teljesitett leckenel is 200, es nem valtoztat semmin. */
    public function store(#[CurrentUser] User $user, int $lesson, CompleteTheoryLesson $complete): JsonResponse
    {
        $model = Lesson::query()
            ->published()
            ->whereHas('module.track', static fn (Builder $track) => $track->where('is_published', true))
            ->findOrFail($lesson);

        $complete->handle($user, $model);

        return response()->json([
            'data' => ['lesson_id' => $model->id, 'status' => LessonProgressStatus::Completed->value],
        ]);
    }
}
