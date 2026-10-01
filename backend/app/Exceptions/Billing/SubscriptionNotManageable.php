<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

use App\Exceptions\DomainException;

final class SubscriptionNotManageable extends DomainException
{
    private function __construct(string $message, private readonly int $httpStatus)
    {
        parent::__construct($message);
    }

    public static function notSubscribed(): self
    {
        return new self(__('billing.not_subscribed'), 409);
    }

    public static function alreadyCanceling(): self
    {
        return new self(__('billing.already_canceling'), 409);
    }

    public static function notCanceling(): self
    {
        return new self(__('billing.not_canceling'), 409);
    }

    public function status(): int
    {
        return $this->httpStatus;
    }
}
