<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Utemezett potlas (#20): a sorbol kiesett vagy az ujraprobalasokat kimerito
 * fuggo szamlakat ujra sorba teszi. A `failed` szamlakhoz nem nyul (azokat
 * a Szamlazz.hu vegleg elutasitotta, kezi javitas kell).
 */
final class RetryPendingInvoices implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        Invoice::query()
            ->where('status', InvoiceStatus::Pending)
            ->where('updated_at', '<', now()->subMinutes(15))
            ->select('id')
            ->chunkById(200, static function ($invoices): void {
                foreach ($invoices as $invoice) {
                    IssueInvoice::dispatch($invoice->id);
                }
            });
    }
}
