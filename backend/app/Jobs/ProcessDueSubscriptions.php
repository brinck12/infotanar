<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Billing\MarkSubscriptionPastDue;
use App\Enums\SubscriptionStatus;
use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Models\Subscription;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Orankenti sweep (#98): a Barion nem vezet elofizetesi ciklust, ezt mi
 * tesszuk.
 *  - Az idoszak vegen lemondott (cancel_at_period_end) elofizetest lezarja.
 *  - A tobbi lejart idoszakut megujitasra kuldi (elofizetesenkent egy job);
 *    kartya-token nelkulit past_due-ba teszi (turelmi ido).
 */
final class ProcessDueSubscriptions implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    public function handle(MarkSubscriptionPastDue $markPastDue): void
    {
        $ended = 0;
        $queued = 0;

        Subscription::query()
            ->where('status', SubscriptionStatus::Active)
            ->where('current_period_end', '<=', now())
            ->chunkById(200, static function ($subscriptions) use (&$ended, &$queued, $markPastDue): void {
                foreach ($subscriptions as $subscription) {
                    if ($subscription->cancel_at_period_end) {
                        $subscription->cancel();
                        $ended++;
                    } elseif ($subscription->provider_subscription_id === null) {
                        // Nincs terhelheto kartya-token: a turelmi ido alatt kartyacserevel (#17) rendezheto.
                        $markPastDue->handle($subscription);
                    } else {
                        ChargeSubscriptionRenewal::dispatch($subscription->id);
                        $queued++;
                    }
                }
            });

        if ($ended > 0 || $queued > 0) {
            Log::info('Billing: due subscriptions processed.', ['ended' => $ended, 'renewals_queued' => $queued]);
        }
    }
}
