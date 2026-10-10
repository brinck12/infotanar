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
use Illuminate\Support\Facades\Log;

/**
 * Utemezett sweep: a lejart turelmi ideju past_due elofizeteseket lezarja,
 * igy a premium hozzaferes megszunik. Idempotens: tobbszori futas ugyanazt
 * az allapotot adja, es egyszerre csak egy peldany fut.
 */
final class ExpireGracePeriods implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    public function handle(NotifySubscriber $notify): void
    {
        $expired = 0;

        Subscription::query()
            ->where('status', SubscriptionStatus::PastDue)
            ->where('grace_ends_at', '<=', now())
            ->chunkById(200, static function ($subscriptions) use (&$expired, $notify): void {
                foreach ($subscriptions as $subscription) {
                    $subscription->cancel();
                    $notify->handle($subscription, SubscriptionNoticeType::Ended);
                    $expired++;
                }
            });

        if ($expired > 0) {
            Log::info('Billing: expired grace periods canceled.', ['count' => $expired]);
        }
    }
}
