<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Exceptions\Catalog\CatalogItemInUse;
use App\Exceptions\Catalog\ExerciseUsedByExam;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Feladat torlese a csatolt fajljaival egyutt.
 *
 * Megtagadjuk, ha visszafordithatatlan adatvesztessel jarna:
 *  - van hozza kod- vagy fajlbeadas (a diak haladasa es elozmenyei ezekre
 *    epulnek): torles helyett el kell rejteni;
 *  - egy vizsgaresz ra mutat: elobb a vizsgabol kell kivenni.
 *
 * A tesztesetek es az ertekelolap az adatbazisban a feladattal egyutt
 * torlodnek (cascade). A csatolmanyoknak nincs idegen kulcsuk (polimorf
 * tulajdonos) es a fajljaik a tarolon vannak, ezert azokat itt toroljuk; a
 * fajlok csak a tranzakcio sikere utan tunnek el.
 */
final readonly class DeleteExercise
{
    private const PARENT = 'lesson_id';

    public function __construct(
        private ManageCatalogItem $catalog,
        private ManageAttachment $attachments,
    ) {}

    /**
     * @throws CatalogItemInUse
     * @throws ExerciseUsedByExam
     */
    public function handle(Exercise $exercise, User $admin): void
    {
        DB::transaction(function () use ($exercise, $admin): void {
            $locked = Exercise::query()->lockForUpdate()->findOrFail($exercise->id);

            if ($locked->submissions()->exists() || $locked->fileSubmissions()->exists()) {
                throw CatalogItemInUse::hasStudentData();
            }

            if ($locked->examParts()->exists()) {
                throw new ExerciseUsedByExam;
            }

            $this->attachments->deleteAllFor($locked);
            $this->catalog->delete($locked, self::PARENT, $admin);
        });
    }
}
