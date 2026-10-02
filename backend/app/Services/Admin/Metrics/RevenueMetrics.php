<?php

declare(strict_types=1);

namespace App\Services\Admin\Metrics;

use App\Enums\PaymentStatus;
use App\Models\Payment;

/** Bevetel (#160): sikeres fizetesek brutto osszege forintban; a definiciok: docs/architecture.md. */
final class RevenueMetrics
{
    public function __construct(private readonly DailySeries $series) {}

    /**
     * @return array{daily: array<string, int>, total: int, total_previous: int, failed: int, failed_previous: int}
     */
    public function collect(LocalDayRange $range, LocalDayRange $previous): array
    {
        $daily = $this->series->sums(Payment::query()->where('status', PaymentStatus::Succeeded), 'paid_at', $range, 'amount');

        return [
            'daily' => $daily,
            'total' => array_sum($daily),
            'total_previous' => $this->revenue($previous),
            'failed' => $this->failed($range),
            'failed_previous' => $this->failed($previous),
        ];
    }

    private function revenue(LocalDayRange $range): int
    {
        return (int) Payment::query()
            ->where('status', PaymentStatus::Succeeded)
            ->where('paid_at', '>=', $range->from)
            ->where('paid_at', '<', $range->to)
            ->sum('amount');
    }

    private function failed(LocalDayRange $range): int
    {
        return Payment::query()
            ->where('status', PaymentStatus::Failed)
            ->where('created_at', '>=', $range->from)
            ->where('created_at', '<', $range->to)
            ->count();
    }
}
