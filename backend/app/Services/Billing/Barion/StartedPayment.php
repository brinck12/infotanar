<?php

declare(strict_types=1);

namespace App\Services\Billing\Barion;

final readonly class StartedPayment
{
    public function __construct(
        public string $paymentId,
        /** A Barion fizetooldala, ide iranyitjuk a vasarlot. */
        public string $gatewayUrl,
        public string $status,
    ) {}
}
