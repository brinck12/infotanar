<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Exceptions\Catalog\ExerciseKindLocked;
use App\Exceptions\Catalog\PublishedExerciseNeedsRubric;
use App\Exceptions\Catalog\PublishedExerciseNeedsSpec;
use App\Exceptions\Catalog\PublishedExerciseNeedsVisibleTestCase;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Catalog\ExercisePublishing;
use Illuminate\Support\Facades\DB;

/**
 * Feladat modositasa (a `lesson_id` valtozasa athelyezes).
 *
 * Ket szabalyt ved, a feladat soranak zarolasa alatt:
 *  - a fajta (`kind`) csak addig valtozhat, amig semmi nem kotodik a jelenlegi
 *    fajtahoz: nincs kod- vagy fajlbeadas, nem resze vizsganak, es nincs
 *    csatolt fajlja (a csatolmanyok szerepe, merete es tipusa fajtafuggo);
 *  - publikalt feladat a modositas utan is megoldhato marad (ExercisePublishing).
 */
final readonly class UpdateExercise
{
    private const PARENT = 'lesson_id';

    public function __construct(
        private ManageCatalogItem $catalog,
        private ExercisePublishing $publishing,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes  az ExerciseRequest::exerciseAttributes() eredmenye
     *
     * @throws ExerciseKindLocked
     * @throws PublishedExerciseNeedsVisibleTestCase
     * @throws PublishedExerciseNeedsSpec
     * @throws PublishedExerciseNeedsRubric
     */
    public function handle(Exercise $exercise, array $attributes, User $admin): Exercise
    {
        return DB::transaction(function () use ($exercise, $attributes, $admin): Exercise {
            $locked = Exercise::query()->lockForUpdate()->findOrFail($exercise->id);
            $locked->fill($attributes);

            if ($locked->isDirty('kind')) {
                $this->assertKindMayChange($locked);
            }

            if ($locked->is_published) {
                $this->publishing->assertPublishable($locked);
            }

            return $this->catalog->update($locked, [], self::PARENT, $admin);
        });
    }

    /** @throws ExerciseKindLocked */
    private function assertKindMayChange(Exercise $exercise): void
    {
        if ($exercise->submissions()->exists() || $exercise->fileSubmissions()->exists()) {
            throw ExerciseKindLocked::hasStudentWork();
        }

        if ($exercise->examParts()->exists()) {
            throw ExerciseKindLocked::usedByExam();
        }

        if ($exercise->attachments()->exists()) {
            throw ExerciseKindLocked::hasAttachments();
        }
    }
}
