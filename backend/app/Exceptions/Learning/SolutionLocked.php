<?php

declare(strict_types=1);

namespace App\Exceptions\Learning;

use App\Exceptions\DomainException;

/** A mintamegoldas megnyitasanak feltetele meg nem teljesult. */
final class SolutionLocked extends DomainException
{
    public function __construct(int $failedSubmissions, int $required)
    {
        parent::__construct(__('learning.solution_locked', ['failed' => $failedSubmissions, 'required' => $required]));
    }

    public function status(): int
    {
        return 403;
    }
}
