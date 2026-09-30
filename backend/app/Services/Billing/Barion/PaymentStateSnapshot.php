<?php

declare(strict_types=1);

namespace App\Services\Billing\Barion;

/** A Barion Payment/PaymentState valaszanak szamunkra fontos resze. */
final readonly class PaymentStateSnapshot
{
    public function __construct(
        public string $paymentId,
        public string $status,
        public ?string $paymentRequestId,
        /** Token-regisztracio eredmenye (pl. "Successful"), ha volt. */
        public ?string $recurrenceResult,
        public ?int $total,
        public ?string $currency,
    ) {}
}
