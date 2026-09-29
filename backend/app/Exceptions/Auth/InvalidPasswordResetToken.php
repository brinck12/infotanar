<?php

declare(strict_types=1);

namespace App\Exceptions\Auth;

use App\Exceptions\DomainException;

final class InvalidPasswordResetToken extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('auth.password_reset.invalid_token'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['token' => [$this->getMessage()]];
    }
}
