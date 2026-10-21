<?php

declare(strict_types=1);

namespace App\Exceptions\Auth;

use App\Exceptions\DomainException;

/** Lejart/ismeretlen kod, hibas verifier vagy a szolgaltato hibaja: egyetlen, nem felderito uzenet. */
final class SocialLoginFailed extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('auth.social.failed'));
    }

    public function status(): int
    {
        return 422;
    }
}
