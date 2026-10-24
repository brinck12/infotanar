<?php

declare(strict_types=1);

namespace App\Exceptions\Auth;

use App\Exceptions\DomainException;

/** A szolgaltato nem igazolta az e-mail-cimet: abbol nem lehet fiokot nyitni vagy fiokhoz kotni. */
final class SocialEmailNotVerified extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('auth.social.email_not_verified'));
    }

    public function status(): int
    {
        return 422;
    }
}
