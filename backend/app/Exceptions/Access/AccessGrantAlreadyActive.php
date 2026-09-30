<?php

declare(strict_types=1);

namespace App\Exceptions\Access;

use App\Exceptions\DomainException;

final class AccessGrantAlreadyActive extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('access.grant_already_active'));
    }

    public function status(): int
    {
        return 409;
    }
}
