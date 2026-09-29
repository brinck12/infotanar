<?php

declare(strict_types=1);

namespace App\Exceptions\Auth;

use App\Exceptions\DomainException;

/** Rossz jelszo es nem letezo fiok ugyanazt adja, hogy a fiokok ne legyenek felderithetok. */
final class InvalidCredentials extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('auth.failed'));
    }

    public function status(): int
    {
        return 401;
    }
}
