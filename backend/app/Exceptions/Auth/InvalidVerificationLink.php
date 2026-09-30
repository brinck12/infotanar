<?php

declare(strict_types=1);

namespace App\Exceptions\Auth;

use App\Exceptions\DomainException;

final class InvalidVerificationLink extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('auth.verification.invalid_link'));
    }

    public function status(): int
    {
        return 403;
    }
}
