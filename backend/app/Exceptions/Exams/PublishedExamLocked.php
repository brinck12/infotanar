<?php

declare(strict_types=1);

namespace App\Exceptions\Exams;

use App\Exceptions\DomainException;

/** Kozzetett vizsgahoz nem adhato uj resz. */
final class PublishedExamLocked extends DomainException
{
    public function __construct(string $key = 'exams.parts_locked')
    {
        parent::__construct(__($key));
    }

    /** Rész törlése közzétett vizsgáról. */
    public static function forRemoval(): self
    {
        return new self('exams.parts_locked_remove');
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
