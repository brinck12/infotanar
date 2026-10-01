<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\Exercise;
use App\Models\ExerciseHint;
use App\Models\User;
use App\Services\Catalog\SiblingOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Tippek kezelese egy feladaton belul (#154). A sorrend (`position`) mindig
 * 0..n-1 (SiblingOrder). A diak az elso k tippet latja (k = megnyitasai), ezert
 * a torles vagy atrendezes nem hagy lyukat a mar megnyitottak kozott.
 */
final readonly class ManageExerciseHint
{
    public function __construct(
        private SiblingOrder $order,
        private RecordAuditEvent $audit,
    ) {}

    public function create(Exercise $exercise, string $body, User $actor): ExerciseHint
    {
        return DB::transaction(function () use ($exercise, $body, $actor): ExerciseHint {
            $hint = new ExerciseHint(['body' => $body]);
            $hint->exercise_id = $exercise->id;
            $hint->position = $this->order->next($this->siblings($exercise));
            $hint->save();

            $this->audit->handle(AuditAction::CatalogCreated, $actor, $hint);

            return $hint;
        });
    }

    public function update(ExerciseHint $hint, string $body, User $actor): ExerciseHint
    {
        return DB::transaction(function () use ($hint, $body, $actor): ExerciseHint {
            $hint->update(['body' => $body]);
            $this->audit->handle(AuditAction::CatalogUpdated, $actor, $hint, ['fields' => ['body']]);

            return $hint;
        });
    }

    public function delete(ExerciseHint $hint, User $actor): void
    {
        DB::transaction(function () use ($hint, $actor): void {
            $exerciseId = $hint->exercise_id;
            $this->audit->handle(AuditAction::CatalogDeleted, $actor, $hint, ['attributes' => $hint->attributesToArray()]);
            $hint->delete();

            $this->order->compact(ExerciseHint::query()->where('exercise_id', $exerciseId));
        });
    }

    /** @param list<int> $orderedIds */
    public function reorder(Exercise $exercise, array $orderedIds, User $actor): void
    {
        DB::transaction(function () use ($exercise, $orderedIds, $actor): void {
            $this->order->reorder($this->siblings($exercise), $orderedIds);
            $this->audit->handle(AuditAction::CatalogReordered, $actor, $exercise, ['hint_order' => $orderedIds]);
        });
    }

    /** @return Builder<ExerciseHint> */
    private function siblings(Exercise $exercise): Builder
    {
        return ExerciseHint::query()->where('exercise_id', $exercise->id);
    }
}
