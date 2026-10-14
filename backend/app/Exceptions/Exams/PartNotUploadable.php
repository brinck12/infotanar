<?php

declare(strict_types=1);

namespace App\Exceptions\Exams;

use App\Exceptions\DomainException;

/** A resz feladata szerkesztos (vagy nincs feladata): ide nem toltheto fel fajl. */
final class PartNotUploadable extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('exams.part_not_uploadable'));
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
