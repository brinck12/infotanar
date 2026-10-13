<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Exams;

use App\Actions\Admin\Exams\ManageExamPart;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\ReorderRequest;
use App\Http\Requests\Admin\Exams\ExamPartRequest;
use App\Http\Resources\Admin\AdminExamResource;
use App\Models\Exam;
use App\Models\ExamPart;
use App\Models\User;
use App\Services\Exams\PartReadiness;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/** Egy vizsga részei. A hozzáadás az egész vizsgát adja vissza, mert a szerkesztő azt tölti újra. */
final class ExamPartController extends Controller
{
    public function __construct(private readonly ManageExamPart $manage) {}

    public function store(ExamPartRequest $request, Exam $exam, #[CurrentUser] User $admin): JsonResponse
    {
        $this->manage->add($exam, $request->partAttributes(), $admin);

        return AdminExamResource::make($exam->load([...PartReadiness::eager(), 'attachments']))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function destroy(ExamPart $part, #[CurrentUser] User $admin): Response
    {
        $this->manage->remove($part, $admin);

        return response()->noContent();
    }

    public function reorder(ReorderRequest $request, Exam $exam, #[CurrentUser] User $admin): Response
    {
        $this->manage->reorder($exam, $request->ids(), $admin);

        return response()->noContent();
    }
}
