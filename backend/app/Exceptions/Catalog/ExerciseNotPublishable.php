<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/**
 * A feladat az allapotaban nem publikalhato: hianyzik a mintamegoldasa, vagy
 * az ertekelolapja nem all meg a sajat mintamegoldasan. A hiba az
 * `is_published` mezohoz kotott, magyar okkal.
 */
final class ExerciseNotPublishable extends DomainException
{
    public static function sampleSolutionMissing(): self
    {
        return new self(__('catalog.needs_sample_solution'));
    }

    public static function fileSampleMissing(): self
    {
        return new self(__('catalog.needs_file_sample'));
    }

    public static function rubricInvalid(): self
    {
        return new self(__('catalog.rubric_invalid'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['is_published' => [$this->getMessage()]];
    }
}
