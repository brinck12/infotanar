<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageCatalogItem;
use App\Exceptions\Catalog\CatalogItemInUse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\LessonRequest;
use App\Http\Resources\Admin\AdminLessonResource;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class LessonController extends Controller
{
    private const PARENT = 'module_id';

    public function __construct(private readonly ManageCatalogItem $manage) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $lessons = Lesson::query()
            ->withCount('exercises')
            ->when($request->integer('module_id'), static fn ($q, int $moduleId) => $q->where('module_id', $moduleId))
            ->orderBy('module_id')
            ->orderBy('position')
            ->get();

        return AdminLessonResource::collection($lessons);
    }

    public function show(Lesson $lesson): AdminLessonResource
    {
        return AdminLessonResource::make($lesson->load(['exercises' => static fn (Relation $q) => $q->withCount(['testCases', 'submissions'])]));
    }

    public function store(LessonRequest $request, #[CurrentUser] User $admin): JsonResponse
    {
        $lesson = $this->manage->create(new Lesson($request->validated()), self::PARENT, $admin);

        return AdminLessonResource::make($lesson)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function update(LessonRequest $request, Lesson $lesson, #[CurrentUser] User $admin): AdminLessonResource
    {
        return AdminLessonResource::make($this->manage->update($lesson, $request->validated(), self::PARENT, $admin));
    }

    /** @throws CatalogItemInUse */
    public function destroy(Lesson $lesson, #[CurrentUser] User $admin): Response
    {
        if ($lesson->exercises()->exists()) {
            throw CatalogItemInUse::hasChildren();
        }

        if (LessonCompletion::query()->where('lesson_id', $lesson->id)->exists()) {
            throw CatalogItemInUse::hasStudentData();
        }

        $this->manage->delete($lesson, self::PARENT, $admin);

        return response()->noContent();
    }
}
