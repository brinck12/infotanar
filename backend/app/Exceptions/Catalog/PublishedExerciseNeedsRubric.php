<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/**
 * Publikalt fajlfeladatnak legalabb egy ertekelesi pontja kell: ertekelolap
 * nelkul a beadott fajlt semmi nem pontozna.
 */
final class PublishedExerciseNeedsRubric extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('catalog.needs_rubric'));
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
