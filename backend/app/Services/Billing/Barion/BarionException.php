<?php

declare(strict_types=1);

namespace App\Services\Billing\Barion;

use App\Exceptions\DomainException;
use Throwable;

/**
 * A fizetesi szolgaltatoval valo kommunikacio hibaja. Az uzenet magyar es
 * altalanos (a felhasznalohoz kerul); a technikai reszletek a naploban.
 */
final class BarionException extends DomainException
{
    private function __construct(string $message, private readonly int $httpStatus, ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }

    public static function unreachable(Throwable $previous): self
    {
        return new self(__('billing.provider_unavailable'), 503, $previous);
    }

    public static function rejected(): self
    {
        return new self(__('billing.provider_rejected'), 502);
    }

    public static function unexpectedResponse(): self
    {
        return new self(__('billing.provider_rejected'), 502);
    }

    public static function notConfigured(): self
    {
        return new self(__('billing.provider_unavailable'), 503);
    }

    public function status(): int
    {
        return $this->httpStatus;
    }
}
