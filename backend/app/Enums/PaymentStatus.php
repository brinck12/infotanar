<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Succeeded = 'succeeded';
    case Failed = 'failed';
    case Canceled = 'canceled';
    case Expired = 'expired';

    public function isFinal(): bool
    {
        return $this !== self::Pending;
    }

    /**
     * Barion allapotok (Payment/PaymentState): Prepared, Started, InProgress,
     * Waiting, Reserved, Authorized -> meg folyamatban; Succeeded,
     * PartiallySucceeded -> sikeres; Canceled, Failed, Expired -> vege.
     */
    public static function fromBarion(string $status): self
    {
        return match ($status) {
            'Succeeded', 'PartiallySucceeded' => self::Succeeded,
            'Canceled' => self::Canceled,
            'Failed' => self::Failed,
            'Expired' => self::Expired,
            default => self::Pending,
        };
    }
}
