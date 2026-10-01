<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

use App\Exceptions\DomainException;

final class CheckoutNotAllowed extends DomainException
{
    private function __construct(string $message, private readonly int $httpStatus)
    {
        parent::__construct($message);
    }

    public static function alreadySubscribed(): self
    {
        return new self(__('billing.already_subscribed'), 409);
    }

    public static function emailNotVerified(): self
    {
        return new self(__('billing.email_not_verified'), 403);
    }

    public function status(): int
    {
        return $this->httpStatus;
    }
}
