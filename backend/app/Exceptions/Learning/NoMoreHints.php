<?php

declare(strict_types=1);

namespace App\Exceptions\Learning;

use App\Exceptions\DomainException;

/** Minden tipp meg van nyitva (vagy a feladathoz nincs tipp). */
final class NoMoreHints extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('learning.no_more_hints'));
    }

    public function status(): int
    {
        return 422;
    }
}
