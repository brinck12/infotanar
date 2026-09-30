<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Billing\Invoicing\IssuePendingInvoice;
use App\Models\Invoice;
use App\Services\Billing\Szamlazz\SzamlazzException;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;

/**
 * Szamla kiallitasa sorban (#20): a Szamlazz.hu kiesese nem akasztja meg a
 * fizetes feldolgozasat. Atmeneti hibanal novekvo varakozassal ujraprobal;
 * vegleges elutasitasnal a szamla `failed` lesz (kezi javitas).
 */
final class IssueInvoice implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 6;

    /** @var list<int> */
    public array $backoff = [60, 300, 900, 3600, 10800];

    public int $uniqueFor = 600;

    public function __construct(public readonly int $invoiceId) {}

    public function uniqueId(): string
    {
        return (string) $this->invoiceId;
    }

    /** @return list<object> */
    public function middleware(): array
    {
        return [(new WithoutOverlapping('invoice:'.$this->invoiceId))->releaseAfter(60)->expireAfter(300)];
    }

    public function handle(IssuePendingInvoice $issue): void
    {
        $invoice = Invoice::query()->find($this->invoiceId);

        if ($invoice === null) {
            return;
        }

        try {
            $issue->handle($invoice);
        } catch (SzamlazzException $e) {
            // Atmeneti hiba: kesobb ujra. Ne dobjuk tovabb, mert sync sor eseten a
            // hivo (a Barion callback) kapna 500-at; a RetryPendingInvoices ugyis potolja.
            Log::warning('Invoice issuing deferred.', ['invoice_id' => $invoice->id, 'error' => $e->getMessage()]);
            $this->release($this->backoff[min($this->attempts() - 1, count($this->backoff) - 1)] ?? 60);
        }
    }
}
