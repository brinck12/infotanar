<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Enums\AttachmentRole;
use App\Exceptions\Catalog\ExerciseNotPublishable;
use App\Exceptions\Catalog\PublishedExerciseNeedsRubric;
use App\Exceptions\Catalog\PublishedExerciseNeedsSpec;
use App\Exceptions\Catalog\PublishedExerciseNeedsVisibleTestCase;
use App\Models\Exercise;
use App\Services\Catalog\Spec\ExerciseSpec;

/**
 * Mikor publikalhato egy feladat: akkor, ha a diak tenyleg meg tudja oldani,
 * van, ami ertekeli, es a szerzo kiprobalta a mintamegoldassal. Fajtankent
 * mast jelent:
 *  - szerkesztos (code, sql): legalabb egy nyilvanos teszteset (enelkul a
 *    "Futtatas" nem mukodik) es mintamegoldas legalabb egy engedelyezett nyelven;
 *  - feltoltos: kitoltott `spec`, legalabb egy ertekelesi pont, feltoltott
 *    mintamegoldas fajl, es az ertekelolap ezen teljes pontot ad;
 *  - bongeszos: kitoltott `spec` legalabb egy ellenorzessel.
 *
 * A kodfeladat mintamegoldasat a kapu nem futtatja (ahhoz Judge0 kell): azt a
 * `catalog:verify` es az admin "Kiprobalas" gombja teszi.
 */
final readonly class ExercisePublishing
{
    public function __construct(
        private ExerciseSpec $spec,
        private ExerciseVerifier $verifier,
    ) {}

    /**
     * A feladat a jelenlegi (akar meg el nem mentett) allapotaban publikalhato-e.
     * Uj, meg nem mentett feladatnak nincs sem tesztesete, sem ertekelolapja.
     *
     * @throws PublishedExerciseNeedsVisibleTestCase
     * @throws PublishedExerciseNeedsSpec
     * @throws PublishedExerciseNeedsRubric
     * @throws ExerciseNotPublishable
     */
    public function assertPublishable(Exercise $exercise): void
    {
        $kind = $exercise->kind;

        if ($kind->isEditorBased()) {
            if (! $exercise->exists || ! $exercise->visibleTestCases()->exists()) {
                throw new PublishedExerciseNeedsVisibleTestCase;
            }

            if (ExerciseVerifier::solutionsOf($exercise) === []) {
                throw ExerciseNotPublishable::sampleSolutionMissing();
            }

            return;
        }

        if (! $this->spec->isComplete($kind, $exercise->spec)) {
            throw new PublishedExerciseNeedsSpec;
        }

        if ($kind->isUpload()) {
            if (! $exercise->exists || ! $exercise->rubricItems()->exists()) {
                throw new PublishedExerciseNeedsRubric;
            }

            if (! $exercise->attachments()->ofRole(AttachmentRole::SampleSolution)->exists()) {
                throw ExerciseNotPublishable::fileSampleMissing();
            }

            if ($this->verifier->verify($exercise)->isFailure()) {
                throw ExerciseNotPublishable::rubricInvalid();
            }
        }
    }
}
