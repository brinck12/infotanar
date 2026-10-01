<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

use App\Exceptions\DomainException;

final class InvoiceAlreadyIssued extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('billing.invoice_already_issued'));
    }

    public function status(): int
    {
        return 409;
    }
}
