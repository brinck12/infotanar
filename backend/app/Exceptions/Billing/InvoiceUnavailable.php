<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

use App\Exceptions\DomainException;

final class InvoiceUnavailable extends DomainException
{
    private function __construct(string $message, private readonly int $httpStatus)
    {
        parent::__construct($message);
    }

    public static function notReady(): self
    {
        return new self(__('billing.invoice_not_ready'), 404);
    }

    public static function providerDown(): self
    {
        return new self(__('billing.invoice_unavailable'), 503);
    }

    public function status(): int
    {
        return $this->httpStatus;
    }
}
