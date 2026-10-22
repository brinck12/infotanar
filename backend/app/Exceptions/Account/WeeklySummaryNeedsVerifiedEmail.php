<?php

declare(strict_types=1);

namespace App\Exceptions\Account;

use App\Exceptions\DomainException;

/** Heti osszefoglalot csak megerositett e-mail-cimre lehet kerni: a level nem juthat rossz kezbe. */
final class WeeklySummaryNeedsVerifiedEmail extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('rhythm.settings.needs_verified_email'));
    }

    public function status(): int
    {
        return 422;
    }
}
