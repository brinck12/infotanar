<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\PaymentStatus;
use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Models\Payment;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Utemezett potlas (#15): ha egy Barion callback elveszett (leallas, halozat),
 * a fuggo fizeteseket magunk kerdezzuk le. A Barion a fizetest legkesobb
 * nehany ora alatt vegleges allapotba viszi (Expired), igy egy nap bosegesen
 * eleg; a fiatal sorokat a callbacknek hagyjuk.
 */
final class SyncPendingPayments implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    public function handle(): void
    {
        $queued = 0;

        Payment::query()
            ->where('status', PaymentStatus::Pending)
            ->whereNotNull('provider_payment_id')
            ->whereBetween('created_at', [now()->subDay(), now()->subMinutes(2)])
            ->select('id')
            ->chunkById(200, static function ($payments) use (&$queued): void {
                foreach ($payments as $payment) {
                    SyncBarionPayment::dispatch($payment->id);
                    $queued++;
                }
            });

        // Inditas kozben megszakadt keres: a sor megmaradt, de Barion-azonosito nem lett.
        $abandoned = Payment::query()
            ->where('status', PaymentStatus::Pending)
            ->whereNull('provider_payment_id')
            ->where('created_at', '<', now()->subHour())
            ->update(['status' => PaymentStatus::Failed, 'provider_status' => 'StartAbandoned']);

        if ($queued > 0 || $abandoned > 0) {
            Log::info('Billing: pending payments swept.', ['queued' => $queued, 'abandoned' => $abandoned]);
        }
    }
}
