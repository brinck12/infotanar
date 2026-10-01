<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/** Egy feladat kozos fajljai, illetve egy teszteset felulirasai korlatozott szamuak. */
final class ExerciseFileLimitReached extends DomainException
{
    public function __construct(int $limit)
    {
        parent::__construct(__('catalog.exercise_file_limit', ['max' => $limit]));
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
