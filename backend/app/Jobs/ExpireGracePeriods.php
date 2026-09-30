<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\SubscriptionStatus;
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
    use Queueable;

    public function handle(): void
    {
        $expired = 0;

        Subscription::query()
            ->where('status', SubscriptionStatus::PastDue)
            ->where('grace_ends_at', '<=', now())
            ->chunkById(200, static function ($subscriptions) use (&$expired): void {
                foreach ($subscriptions as $subscription) {
                    $subscription->cancel();
                    $expired++;
                }
            });

        if ($expired > 0) {
            Log::info('Billing: expired grace periods canceled.', ['count' => $expired]);
        }
    }
}
