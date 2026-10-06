<?php

declare(strict_types=1);

namespace App\Actions\Catalog;

use App\Enums\ExerciseProgressStatus;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Catalog\TaskFilters;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Query\Builder as QueryBuilder;

/**
 * A publikalt feladatok szurt listaja, nehezseg szerint. Az allapot szerinti
 * szures a nezo beadasaibol szamol; vendegnel nincs mibol, ezert kimarad.
 */
final class ListTasks
{
    /** A lista-nezethez kello kapcsolatok: modul ("topic"), lecke, es a lecke oldalara vezeto ut. */
    public const WITH_TOPIC = [
        'lesson:id,module_id,slug,title,is_free,video_path',
        'lesson.module:id,track_id,title,slug',
        'lesson.module.track:id,slug',
    ];

    /** @return Collection<int, Exercise> */
    public function handle(TaskFilters $filters, ?User $viewer): Collection
    {
        return Exercise::query()
            ->published()
            ->with(self::WITH_TOPIC)
            ->when($filters->topicSlug, static fn (Builder $query, string $slug) => $query
                ->whereHas('lesson.module', static fn (Builder $module) => $module->where('slug', $slug)))
            ->when($filters->level, static fn (Builder $query, string $level) => $query->where('level', $level))
            ->when($filters->language, static fn (Builder $query, string $language) => $query->whereJsonContains('allowed_languages', $language))
            ->when($filters->difficulty, static fn (Builder $query, int $difficulty) => $query->where('difficulty', $difficulty))
            ->when(
                $viewer !== null && $filters->status !== null,
                fn (Builder $query) => $this->whereStatus($query, (string) $filters->status, (int) $viewer?->id),
            )
            ->orderBy('difficulty')
            ->orderBy('title')
            ->get();
    }

    /** @param Builder<Exercise> $query */
    private function whereStatus(Builder $query, string $status, int $viewerId): void
    {
        $submissions = static fn (bool $onlyPassed): Closure => static fn (QueryBuilder $submissions) => $submissions
            ->from('submissions')
            ->whereColumn('submissions.exercise_id', 'exercises.id')
            ->where('submissions.user_id', $viewerId)
            ->when($onlyPassed, static fn (QueryBuilder $passed) => $passed->where('submissions.status', 'passed'));

        match ($status) {
            ExerciseProgressStatus::Solved->value => $query->whereExists($submissions(true)),
            ExerciseProgressStatus::Attempted->value => $query->whereExists($submissions(false))->whereNotExists($submissions(true)),
            default => $query->whereNotExists($submissions(true)),
        };
    }
}
