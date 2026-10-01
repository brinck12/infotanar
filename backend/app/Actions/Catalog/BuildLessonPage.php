<?php

declare(strict_types=1);

namespace App\Actions\Catalog;

use App\Models\Lesson;
use App\Models\Submission;
use App\Models\Track;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Catalog\LessonPage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Relations\Relation;

/**
 * Osszeallitja egy lecke oldalat (#143). A lecke slugja csak a modulon belul
 * egyedi, ezert a kepzesi agon keresztul keressuk: az ag publikalt leckeinek
 * sorrendje adja az elozo es a kovetkezo lecket is.
 */
final readonly class BuildLessonPage
{
    public function __construct(private ContentAccess $access) {}

    /** @throws ModelNotFoundException ha a kepzesi ag vagy a lecke nem letezik, vagy nincs publikalva */
    public function handle(?User $viewer, string $trackSlug, string $lessonSlug): LessonPage
    {
        $track = Track::query()->published()->where('slug', $trackSlug)->firstOrFail();

        $sequence = $this->lessonSequence($track);
        $earlier = $sequence->takeUntil(static fn (Lesson $lesson): bool => $lesson->slug === $lessonSlug);
        // A keresett lecke es az utana kovetkezok.
        $fromRequested = $sequence->slice($earlier->count())->values();

        $requested = $fromRequested->first() ?? throw (new ModelNotFoundException)->setModel(Lesson::class);

        $lesson = Lesson::query()
            ->with([
                'module:id,title',
                'exercises' => static fn (Relation $query) => $query->where('is_published', true),
            ])
            ->findOrFail($requested->id);

        return new LessonPage(
            track: $track,
            lesson: $lesson,
            previous: $earlier->last(),
            next: $fromRequested->get(1),
            denial: $this->access->denialFor($viewer, $lesson),
            solvedExerciseIds: $this->solvedExerciseIds($viewer, $lesson),
        );
    }

    /**
     * Az ag publikalt leckei tanulasi sorrendben, a tartalmuk nelkul.
     *
     * @return Collection<int, Lesson>
     */
    private function lessonSequence(Track $track): Collection
    {
        return Lesson::query()
            ->join('modules', 'modules.id', '=', 'lessons.module_id')
            ->where('modules.track_id', $track->id)
            ->where('lessons.is_published', true)
            ->orderBy('modules.position')
            ->orderBy('modules.id')
            ->orderBy('lessons.position')
            ->orderBy('lessons.id')
            ->get(['lessons.id', 'lessons.slug', 'lessons.title']);
    }

    /** @return array<int, true> */
    private function solvedExerciseIds(?User $viewer, Lesson $lesson): array
    {
        if ($viewer === null || $lesson->exercises->isEmpty()) {
            return [];
        }

        return Submission::query()
            ->where('user_id', $viewer->id)
            ->where('status', 'passed')
            ->whereIn('exercise_id', $lesson->exercises->modelKeys())
            ->distinct()
            ->get(['exercise_id'])
            ->mapWithKeys(static fn (Submission $submission): array => [$submission->exercise_id => true])
            ->all();
    }
}
