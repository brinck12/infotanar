<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Models\Invoice;
use App\Models\Payment;
use App\Support\Alerts\OperatorAlert;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Napi osszesito arrol, ami magatol nem oldodik meg (#131): elutasitott
 * szamla, egy napnal regebb ota fuggo szamla vagy fizetes. A sweep jobok
 * ezeket mar probaltak potolni; ami itt megjelenik, ahhoz ember kell.
 */
final class ReportStuckBilling implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    public function handle(OperatorAlert $alert): void
    {
        $dayAgo = now()->subDay();

        $stuck = array_filter([
            'failed_invoices' => Invoice::query()->where('status', InvoiceStatus::Failed)->count(),
            'invoices_pending_over_24h' => Invoice::query()
                ->where('status', InvoiceStatus::Pending)
                ->where('created_at', '<', $dayAgo)
                ->count(),
            'payments_pending_over_24h' => Payment::query()
                ->where('status', PaymentStatus::Pending)
                ->where('created_at', '<', $dayAgo)
                ->count(),
        ]);

        if ($stuck !== []) {
            $alert->raise(__('alerts.stuck_billing'), $stuck);
        }
    }
}
