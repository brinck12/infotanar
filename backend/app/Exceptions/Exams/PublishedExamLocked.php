<?php

declare(strict_types=1);

namespace App\Exceptions\Exams;

use App\Exceptions\DomainException;

/** Kozzetett vizsgahoz nem adhato uj resz. */
final class PublishedExamLocked extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('exams.parts_locked'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['parts' => [$this->getMessage()]];
    }
}
