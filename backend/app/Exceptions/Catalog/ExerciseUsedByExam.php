<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/**
 * Torles megtagadva, mert egy vizsgaresz erre a feladatra mutat: a torles
 * csendben kiuritene a vizsga egy reszet. Elobb a vizsgabol kell kivenni.
 */
final class ExerciseUsedByExam extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('catalog.delete_used_by_exam'));
    }

    public function status(): int
    {
        return 409;
    }
}
