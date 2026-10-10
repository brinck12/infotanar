<?php

declare(strict_types=1);

namespace App\Actions\Billing;

use App\Enums\SubscriptionNoticeType;
use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use Illuminate\Support\Facades\Config;

/**
 * Sikertelen megujitas (a szolgaltato webhookja hivja, #15): a hozzaferes a
 * turelmi ido vegeig megmarad. Ismetelt hivas (ujrakuldott webhook) nem
 * tolja ki a turelmi idot.
 */
final readonly class MarkSubscriptionPastDue
{
    public function __construct(private NotifySubscriber $notify) {}

    public function handle(Subscription $subscription): Subscription
    {
        if ($subscription->status === SubscriptionStatus::PastDue || ! $subscription->isLive()) {
            return $subscription;
        }

        $subscription->forceFill([
            'status' => SubscriptionStatus::PastDue,
            'grace_ends_at' => now()->addDays(Config::integer('billing.grace_period_days')),
        ])->save();

        // A felhasznalo innen tudja meg, meddig rendezheti a fizetest (#137).
        $this->notify->handle($subscription, SubscriptionNoticeType::RenewalFailed);

        return $subscription;
    }
}
