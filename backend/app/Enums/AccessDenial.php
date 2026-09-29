<?php

declare(strict_types=1);

namespace App\Enums;

/** Miert nem ferhet hozza a kero egy fizetos tartalomhoz. A kliens a `value`-ra agazhat el. */
enum AccessDenial: string
{
    case LoginRequired = 'login_required';
    case EmailUnverified = 'email_unverified';
    case SubscriptionRequired = 'subscription_required';

    public function message(): string
    {
        return __("access.{$this->value}");
    }
}
