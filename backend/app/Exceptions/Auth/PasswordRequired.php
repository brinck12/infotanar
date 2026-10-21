<?php

declare(strict_types=1);

namespace App\Exceptions\Auth;

use App\Exceptions\DomainException;

/** Jelszot kero muvelet olyan fiokon, amelyhez (kozossegi belepes miatt) nincs jelszo. */
final class PasswordRequired extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('auth.social.password_required'));
    }

    public function status(): int
    {
        return 422;
    }
}
