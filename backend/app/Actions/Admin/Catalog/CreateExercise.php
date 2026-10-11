<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Exceptions\Catalog\PublishedExerciseNeedsRubric;
use App\Exceptions\Catalog\PublishedExerciseNeedsSpec;
use App\Exceptions\Catalog\PublishedExerciseNeedsVisibleTestCase;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Catalog\ExercisePublishing;

/**
 * Uj feladat a lecke vegere.
 *
 * Szerkesztos es feltoltos feladat nem hozhato letre publikaltkent, mert meg
 * nincs tesztesete, illetve ertekelolapja: letrehozas -> tesztesetek vagy
 * ertekelolap -> publikalas. Bongeszos feladat azonnal publikalhato, ha a
 * `spec`-je mar tartalmaz ellenorzest.
 */
final readonly class CreateExercise
{
    private const PARENT = 'lesson_id';

    public function __construct(
        private ManageCatalogItem $catalog,
        private ExercisePublishing $publishing,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes  az ExerciseRequest::exerciseAttributes() eredmenye
     *
     * @throws PublishedExerciseNeedsVisibleTestCase
     * @throws PublishedExerciseNeedsSpec
     * @throws PublishedExerciseNeedsRubric
     */
    public function handle(array $attributes, User $admin): Exercise
    {
        $exercise = new Exercise($attributes);

        if ($exercise->getAttribute('is_published') === true) {
            $this->publishing->assertPublishable($exercise);
        }

        // Ujraolvasva: az el nem kuldott mezok az adatbazis alapertekeit kapjak,
        // igy az eroforras minden mezot ki tud irni.
        return $this->catalog->create($exercise, self::PARENT, $admin)->refresh();
    }
}
