<?php

declare(strict_types=1);

namespace App\Services\Admin\Metrics;

use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use Illuminate\Support\Facades\Config;

/** Elofizetesek (#160); a definiciok: docs/architecture.md. */
final class SubscriptionMetrics
{
    /**
     * @return array{
     *     active: int, past_due: int, cancelling: int,
     *     new: int, new_previous: int, churned: int, churned_previous: int,
     *     mrr_huf: int
     * }
     */
    public function collect(LocalDayRange $range, LocalDayRange $previous): array
    {
        $active = Subscription::query()->where('status', SubscriptionStatus::Active)->count();

        return [
            'active' => $active,
            'past_due' => Subscription::query()->where('status', SubscriptionStatus::PastDue)->count(),
            'cancelling' => Subscription::query()->where('status', SubscriptionStatus::Active)->where('cancel_at_period_end', true)->count(),
            'new' => $this->created($range),
            'new_previous' => $this->created($previous),
            'churned' => $this->churned($range),
            'churned_previous' => $this->churned($previous),
            // Az aktiv elofizetesek havi dijanak osszege. Az egyetlen csomag ara a configbol jon;
            // elofizetesenkenti ar (#170) utan az elofizetesek sajat arabol szamolodik.
            'mrr_huf' => $active * $this->monthlyPrice(),
        ];
    }

    private function created(LocalDayRange $range): int
    {
        return Subscription::query()->where('created_at', '>=', $range->from)->where('created_at', '<', $range->to)->count();
    }

    private function churned(LocalDayRange $range): int
    {
        return Subscription::query()
            ->where('status', SubscriptionStatus::Canceled)
            ->where('canceled_at', '>=', $range->from)
            ->where('canceled_at', '<', $range->to)
            ->count();
    }

    private function monthlyPrice(): int
    {
        return (int) round(Config::integer('billing.plan.price_huf') / max(1, Config::integer('billing.plan.period_months')));
    }
}
