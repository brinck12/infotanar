<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\Exercise;
use App\Models\ExerciseSolution;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Mintamegoldasok kezelese (#154): nyelvenkent egy; a mentes letrehoz vagy lecsereli. */
final readonly class ManageExerciseSolution
{
    public function __construct(private RecordAuditEvent $audit) {}

    public function save(Exercise $exercise, string $language, string $sourceCode, ?string $explanation, User $actor): ExerciseSolution
    {
        return DB::transaction(function () use ($exercise, $language, $sourceCode, $explanation, $actor): ExerciseSolution {
            $solution = ExerciseSolution::query()->firstOrNew(['exercise_id' => $exercise->id, 'language' => $language]);
            $created = ! $solution->exists;

            $solution->fill(['source_code' => $sourceCode, 'explanation' => $explanation])->save();

            // A forraskod nem kerul az audit naploba, csak a nyelv.
            $this->audit->handle(
                $created ? AuditAction::CatalogCreated : AuditAction::CatalogUpdated,
                $actor,
                $solution,
                ['language' => $language],
            );

            return $solution;
        });
    }

    public function delete(ExerciseSolution $solution, User $actor): void
    {
        DB::transaction(function () use ($solution, $actor): void {
            $this->audit->handle(AuditAction::CatalogDeleted, $actor, $solution, ['language' => $solution->language]);
            $solution->delete();
        });
    }
}
