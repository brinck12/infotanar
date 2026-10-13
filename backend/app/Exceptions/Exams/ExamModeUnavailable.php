<?php

declare(strict_types=1);

namespace App\Exceptions\Exams;

use App\Exceptions\DomainException;

/** Vizsgahelyzet kert, de a vizsgan nincs engedelyezve az idozitett mod. */
final class ExamModeUnavailable extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('exams.mode_unavailable'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['mode' => [$this->getMessage()]];
    }
}
