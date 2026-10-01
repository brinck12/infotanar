<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Billing\NotifySubscriber;
use App\Enums\SubscriptionNoticeType;
use App\Enums\SubscriptionStatus;
use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Models\Subscription;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Config;

/**
 * Napi emlekezteto a kozelgo megujitasrol (#137): a terheles elott par
 * nappal megirjuk, mikor es mennyit vonunk le, hogy legyen ido lemondani.
 * Idoszakonkent egy level megy (a NotifySubscriber gondoskodik rola), ezert
 * a job nyugodtan futhat naponta ugyanarra az elofizetesre.
 */
final class SendRenewalReminders implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    public function handle(NotifySubscriber $notify): void
    {
        Subscription::query()
            ->where('status', SubscriptionStatus::Active)
            ->where('cancel_at_period_end', false)
            ->whereNotNull('provider_subscription_id')
            ->whereBetween('current_period_end', [now(), now()->addDays(Config::integer('billing.renewal_reminder_days'))])
            ->with('user')
            ->chunkById(200, static function ($subscriptions) use ($notify): void {
                foreach ($subscriptions as $subscription) {
                    $notify->handle($subscription, SubscriptionNoticeType::RenewalReminder);
                }
            });
    }
}
