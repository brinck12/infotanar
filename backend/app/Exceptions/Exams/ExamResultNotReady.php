<?php

declare(strict_types=1);

namespace App\Exceptions\Exams;

use App\Exceptions\DomainException;

/** A probalkozas meg nincs ertekelve. */
final class ExamResultNotReady extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('exams.result_not_ready'));
    }

    public function status(): int
    {
        return 409;
    }
}
