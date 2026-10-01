<?php

declare(strict_types=1);

namespace App\Actions\Catalog;

use App\Models\Lesson;
use App\Models\Track;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Catalog\CurriculumOrder;
use App\Services\Catalog\LessonPage;
use App\Services\Progress\ExerciseStatuses;
use App\Services\Progress\LessonStatuses;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Relations\Relation;

/**
 * Osszeallitja egy lecke oldalat (#143). A lecke slugja csak a modulon belul
 * egyedi, ezert a kepzesi agon keresztul keressuk: az ag publikalt leckeinek
 * sorrendje adja az elozo es a kovetkezo lecket is.
 */
final readonly class BuildLessonPage
{
    public function __construct(
        private ContentAccess $access,
        private CurriculumOrder $order,
    ) {}

    /** @throws ModelNotFoundException ha a kepzesi ag vagy a lecke nem letezik, vagy nincs publikalva */
    public function handle(?User $viewer, string $trackSlug, string $lessonSlug): LessonPage
    {
        $track = Track::query()->published()->where('slug', $trackSlug)->firstOrFail();

        $sequence = $this->order->lessons($track->id);
        $requested = $sequence->firstWhere('slug', $lessonSlug) ?? throw (new ModelNotFoundException)->setModel(Lesson::class);
        $neighbours = $this->order->neighbours($sequence, $requested->id);

        $lesson = Lesson::query()
            ->with([
                'module:id,title',
                'exercises' => static fn (Relation $query) => $query->where('is_published', true),
            ])
            ->findOrFail($requested->id);

        return new LessonPage(
            track: $track,
            lesson: $lesson,
            previous: $neighbours['previous'],
            next: $neighbours['next'],
            denial: $this->access->denialFor($viewer, $lesson),
            exerciseStatuses: ExerciseStatuses::for($viewer),
            status: $viewer === null ? null : LessonStatuses::forUser($viewer)->of($lesson->id),
        );
    }
}
