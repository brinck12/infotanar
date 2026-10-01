<?php

declare(strict_types=1);

namespace App\Exceptions\Learning;

use App\Exceptions\DomainException;

/** A feladathoz a szerzo nem irt mintamegoldast. */
final class SolutionNotAvailable extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('learning.solution_not_available'));
    }

    public function status(): int
    {
        return 404;
    }
}
