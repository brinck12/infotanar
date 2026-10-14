<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Exams;

use App\Actions\Exams\StartExamAttempt;
use App\Actions\Exams\SubmitExamAttempt;
use App\Enums\ExamAttemptState;
use App\Exceptions\Exams\ExamResultNotReady;
use App\Http\Controllers\Controller;
use App\Http\Requests\Exams\StartExamAttemptRequest;
use App\Http\Resources\Exams\ExamAttemptResource;
use App\Http\Resources\Exams\ExamResultResource;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use App\Services\Exams\AttemptClock;
use App\Services\Exams\AttemptView;
use App\Services\Exams\ResultWriter;
use App\Services\Exams\ReviewSuggester;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

/**
 * Vizsgaprobalkozas: inditas, allapot, beadas es eredmeny. Mas probalkozasa 404
 * (az ExamAttemptPolicy tiltasat a vezerlo 404-kent adja), igy a letezese sem derul ki.
 */
final class ExamAttemptController extends Controller
{
    public function __construct(
        private readonly AttemptView $view,
        private readonly AttemptClock $clock,
    ) {}

    /** Uj probalkozas (201), vagy a mar nyitott visszaadasa valtozatlanul (200). */
    public function store(StartExamAttemptRequest $request, #[CurrentUser] User $user, int $exam, StartExamAttempt $start): JsonResponse
    {
        $model = Exam::query()->published()->findOrFail($exam);
        $attempt = $start->handle($user, $model, $request->mode());

        return $this->respond($attempt, $attempt->wasRecentlyCreated ? JsonResponse::HTTP_CREATED : JsonResponse::HTTP_OK);
    }

    /** A lekeres egyben a lusta lejarat ellenorzese: lejart probalkozast beadja es ertekeli. */
    public function show(#[CurrentUser] User $user, int $attempt, SubmitExamAttempt $submit): JsonResponse
    {
        $model = $this->find($user, 'view', $attempt);

        return $this->respond($submit->closeIfExpired($model));
    }

    public function submit(#[CurrentUser] User $user, int $attempt, SubmitExamAttempt $submit): JsonResponse
    {
        $model = $this->find($user, 'submit', $attempt);

        return $this->respond($submit->handle($model));
    }

    /** @throws ExamResultNotReady ha a probalkozas meg nincs ertekelve */
    public function result(#[CurrentUser] User $user, int $attempt, ResultWriter $writer, ReviewSuggester $suggester): ExamResultResource
    {
        $model = $this->find($user, 'view', $attempt);

        if ($model->state !== ExamAttemptState::Evaluated) {
            throw new ExamResultNotReady;
        }

        $model->load('exam.parts.exercise.lesson.module.track');
        $scores = $writer->read($model);

        return new ExamResultResource($this->view->one($model), $scores, $suggester->suggest($model, $scores));
    }

    private function find(User $user, string $ability, int $id): ExamAttempt
    {
        $attempt = ExamAttempt::query()->findOrFail($id);
        abort_unless($user->can($ability, $attempt), 404);

        return $attempt;
    }

    private function respond(ExamAttempt $attempt, int $status = JsonResponse::HTTP_OK): JsonResponse
    {
        return (new ExamAttemptResource($this->view->one($attempt), $this->clock->now()))
            ->response()
            ->setStatusCode($status);
    }
}
