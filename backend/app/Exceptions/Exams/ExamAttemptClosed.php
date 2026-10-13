<?php

declare(strict_types=1);

namespace App\Exceptions\Exams;

use App\Exceptions\DomainException;

/** A probalkozas mar be van adva (vagy lejart): a megoldasok nem modosithatok. */
final class ExamAttemptClosed extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('exams.attempt_closed'));
    }

    public function status(): int
    {
        return 409;
    }
}
