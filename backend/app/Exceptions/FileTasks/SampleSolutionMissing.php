<?php

declare(strict_types=1);

namespace App\Exceptions\FileTasks;

use App\Exceptions\DomainException;

/**
 * Ertekelolap-proba fajl nelkul, mikozben a feladatnak nincs feltoltott
 * mintamegoldasa (`sample_solution` csatolmany): nincs mit ellenorizni.
 */
final class SampleSolutionMissing extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('filetasks.sample_solution_missing'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['file' => [$this->getMessage()]];
    }
}
