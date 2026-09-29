<?php

declare(strict_types=1);

namespace App\Actions\Billing;

use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use Carbon\CarbonInterface;

/** Sikeres (akar kesoi) fizetes: vissza active-ba, uj idoszakkal, turelmi ido nelkul. */
final class ReactivateSubscription
{
    public function handle(Subscription $subscription, CarbonInterface $periodStart, CarbonInterface $periodEnd): Subscription
    {
        $subscription->forceFill([
            'status' => SubscriptionStatus::Active,
            'grace_ends_at' => null,
            'current_period_start' => $periodStart,
            'current_period_end' => $periodEnd,
        ])->save();

        return $subscription;
    }
}
