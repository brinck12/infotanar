<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

final class InvalidOrder extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('catalog.invalid_order'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['ids' => [$this->getMessage()]];
    }
}
