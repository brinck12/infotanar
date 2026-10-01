<?php

declare(strict_types=1);

namespace App\Actions\Catalog;

use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Catalog\CurriculumOrder;
use App\Services\Catalog\TaskNavigation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\Relation;

/**
 * Egy feladat elozo es kovetkezo feladata, valamint a kovetkezo lecke (#145).
 * A sorrend: modul, azon belul lecke, azon belul feladat pozicio; a nem
 * publikalt elemek kimaradnak. Ket lekerdezes, az ag meretetol fuggetlenul.
 *
 * @phpstan-import-type ExerciseLink from TaskNavigation
 * @phpstan-import-type LessonLink from TaskNavigation
 */
final readonly class BuildTaskNavigation
{
    public function __construct(
        private CurriculumOrder $order,
        private ContentAccess $access,
    ) {}

    public function handle(?User $viewer, Exercise $exercise): TaskNavigation
    {
        $trackId = $exercise->lesson->module?->track_id;

        if ($trackId === null) {
            return new TaskNavigation(null, null, null);
        }

        $lessons = $this->order->lessons($trackId)->load([
            'exercises' => static fn (Relation $query) => $query
                ->where('is_published', true)
                ->select(['id', 'lesson_id', 'title', 'position']),
        ]);

        $exercises = $lessons->flatMap(static fn (Lesson $lesson): array => $lesson->exercises->all());

        $exerciseNeighbours = $this->order->neighbours($exercises, $exercise->id);
        $lessonNeighbours = $this->order->neighbours($lessons, $exercise->lesson_id);

        return new TaskNavigation(
            previous: $this->exerciseLink($viewer, $exerciseNeighbours['previous'], $lessons),
            next: $this->exerciseLink($viewer, $exerciseNeighbours['next'], $lessons),
            nextLesson: $this->lessonLink($viewer, $lessonNeighbours['next']),
        );
    }

    /**
     * @param  Collection<int, Lesson>  $lessons
     * @return ExerciseLink|null
     */
    private function exerciseLink(?User $viewer, ?Exercise $exercise, Collection $lessons): ?array
    {
        $lesson = $exercise === null ? null : $lessons->find($exercise->lesson_id);

        if ($exercise === null || $lesson === null) {
            return null;
        }

        return [
            'id' => $exercise->id,
            'title' => $exercise->title,
            'lesson_id' => $lesson->id,
            'locked' => ! $this->access->allows($viewer, $lesson),
        ];
    }

    /** @return LessonLink|null */
    private function lessonLink(?User $viewer, ?Lesson $lesson): ?array
    {
        if ($lesson === null) {
            return null;
        }

        return [
            'slug' => $lesson->slug,
            'title' => $lesson->title,
            'locked' => ! $this->access->allows($viewer, $lesson),
        ];
    }
}
