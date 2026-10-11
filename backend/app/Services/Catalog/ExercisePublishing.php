<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Exceptions\Catalog\PublishedExerciseNeedsRubric;
use App\Exceptions\Catalog\PublishedExerciseNeedsSpec;
use App\Exceptions\Catalog\PublishedExerciseNeedsVisibleTestCase;
use App\Models\Exercise;
use App\Services\Catalog\Spec\ExerciseSpec;

/**
 * Mikor publikalhato egy feladat: akkor, ha a diak tenyleg meg tudja oldani
 * es van, ami ertekeli. Fajtankent mast jelent:
 *  - szerkesztos (code, sql): legalabb egy nyilvanos teszteset (enelkul a
 *    "Futtatas" nem mukodik);
 *  - feltoltos: kitoltott `spec` es legalabb egy ertekelesi pont;
 *  - bongeszos: kitoltott `spec` legalabb egy ellenorzessel.
 */
final readonly class ExercisePublishing
{
    public function __construct(private ExerciseSpec $spec) {}

    /**
     * A feladat a jelenlegi (akar meg el nem mentett) allapotaban publikalhato-e.
     * Uj, meg nem mentett feladatnak nincs sem tesztesete, sem ertekelolapja.
     *
     * @throws PublishedExerciseNeedsVisibleTestCase
     * @throws PublishedExerciseNeedsSpec
     * @throws PublishedExerciseNeedsRubric
     */
    public function assertPublishable(Exercise $exercise): void
    {
        $kind = $exercise->kind;

        if ($kind->isEditorBased()) {
            if (! $exercise->exists || ! $exercise->visibleTestCases()->exists()) {
                throw new PublishedExerciseNeedsVisibleTestCase;
            }

            return;
        }

        if (! $this->spec->isComplete($kind, $exercise->spec)) {
            throw new PublishedExerciseNeedsSpec;
        }

        if ($kind->isUpload() && (! $exercise->exists || ! $exercise->rubricItems()->exists())) {
            throw new PublishedExerciseNeedsRubric;
        }
    }
}
