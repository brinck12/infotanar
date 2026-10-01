<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Billing\ChargeRenewal;
use App\Models\Subscription;
use App\Services\Billing\Barion\BarionException;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Egy elofizetes megujitasa (#98). Elofizetesenkent egyszerre egy fut;
 * atmeneti Barion-hibanal kesobb ujraprobal (ugyanazzal a fizetes-sorral,
 * igy dupla terheles nem lehet).
 */
final class ChargeSubscriptionRenewal implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 4;

    /** @var list<int> */
    public array $backoff = [300, 1800, 7200];

    public int $uniqueFor = 3600;

    public function __construct(public readonly int $subscriptionId) {}

    public function uniqueId(): string
    {
        return (string) $this->subscriptionId;
    }

    public function handle(ChargeRenewal $charge): void
    {
        $subscription = Subscription::query()->find($this->subscriptionId);

        if ($subscription === null) {
            return;
        }

        try {
            $charge->handle($subscription);
        } catch (BarionException $e) {
            // Sync sorban se dobjunk tovabb: az utemezett sweep kesobb ujra probalja.
            Log::warning('Renewal charge deferred.', ['subscription_id' => $subscription->id, 'error' => $e->getMessage()]);
            $this->release($this->backoff[min($this->attempts() - 1, count($this->backoff) - 1)]);
        }
    }
}
