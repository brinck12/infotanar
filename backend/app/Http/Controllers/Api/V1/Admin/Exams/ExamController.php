<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Exams;

use App\Actions\Admin\Exams\ManageExam;
use App\Exceptions\Exams\ExamNotPublishable;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Exams\ExamRequest;
use App\Http\Resources\Admin\AdminExamResource;
use App\Models\Exam;
use App\Models\User;
use App\Services\Exams\PartReadiness;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Gyakorló vizsgák szerkesztése az admin felületen (a részek és a fájlok külön vezérlőben). */
final class ExamController extends Controller
{
    public function __construct(private readonly ManageExam $manage) {}

    /** Az összes vizsga, a legújabb időszak elöl; nincs lapozás (néhány tucat sor). */
    public function index(): AnonymousResourceCollection
    {
        $exams = Exam::query()
            ->with([...PartReadiness::eager(), 'attachments'])
            ->orderByDesc('session')
            ->orderBy('level')
            ->orderBy('id')
            ->get();

        return AdminExamResource::collection($exams);
    }

    /** @throws ExamNotPublishable */
    public function store(ExamRequest $request, #[CurrentUser] User $admin): JsonResponse
    {
        $exam = $this->manage->create($request->examAttributes(), $admin);

        return AdminExamResource::make($this->fresh($exam))->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function show(Exam $exam): AdminExamResource
    {
        return AdminExamResource::make($this->fresh($exam));
    }

    /** @throws ExamNotPublishable */
    public function update(ExamRequest $request, Exam $exam, #[CurrentUser] User $admin): AdminExamResource
    {
        return AdminExamResource::make($this->fresh($this->manage->update($exam, $request->examAttributes(), $admin)));
    }

    private function fresh(Exam $exam): Exam
    {
        return $exam->load([...PartReadiness::eager(), 'attachments']);
    }
}
