<?php

declare(strict_types=1);

namespace App\Actions\Billing\Invoicing;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use App\Services\Billing\Szamlazz\InvoiceXml;
use App\Services\Billing\Szamlazz\SzamlazzClient;
use App\Services\Billing\Szamlazz\SzamlazzException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Egy fuggo szamla kiallitasa a Szamla Agenttel (#20, ADR 0002).
 *
 * Pontosan egy szamla: az Agentnek nincs idempotencia-kulcsa, ezert a
 * kiserletet a hivas ELOTT rogzitjuk (`attempts`). Ha mar volt kiserlet, a
 * kimenetele bizonytalan lehetett, ezert ujrakuldes elott a rendelesszam (a
 * fizetes request_id-ja) alapjan rakerdezunk, hogy keszult-e mar szamla.
 * Szamlankent egyszerre egy peldany fut (lasd az IssueInvoice jobot).
 */
final readonly class IssuePendingInvoice
{
    public function __construct(private SzamlazzClient $szamlazz) {}

    /** @throws SzamlazzException ujraprobalhato hibanal; a job ujrafuttatja */
    public function handle(Invoice $invoice): Invoice
    {
        if ($invoice->status !== InvoiceStatus::Pending) {
            return $invoice;
        }

        $payment = $invoice->payment()->firstOrFail();
        $agentKey = $this->szamlazz->agentKey();

        if ($invoice->attempts > 0) {
            $existing = $this->szamlazz->findNumberByOrder(InvoiceXml::queryByOrderNumber($agentKey, $payment->request_id));

            if ($existing !== null) {
                return $this->markIssued($invoice, $existing, null);
            }
        }

        $invoice->increment('attempts');
        $prefix = Config::get('billing.szamlazz.invoice_prefix');

        try {
            $issued = $this->szamlazz->issue(InvoiceXml::issue($invoice, $agentKey, $payment->request_id, $payment->paid_at ?? now(), [
                'prefix' => is_string($prefix) && $prefix !== '' ? $prefix : null,
                'item_name' => Config::string('billing.plan.name'),
                'unit' => 'hónap',
            ]));
        } catch (SzamlazzException $e) {
            $invoice->forceFill([
                'last_error' => Str::limit($e->getMessage(), 490),
                'status' => $e->retryable ? InvoiceStatus::Pending : InvoiceStatus::Failed,
            ])->save();

            if (! $e->retryable) {
                Log::critical('Invoice rejected by Szamlazz.hu; manual action needed.', ['invoice_id' => $invoice->id]);

                return $invoice;
            }

            throw $e;
        }

        return $this->markIssued($invoice, $issued->number, $issued->pdf);
    }

    private function markIssued(Invoice $invoice, string $number, ?string $pdf): Invoice
    {
        $path = null;

        if ($pdf !== null) {
            $path = self::pdfPath($number);
            Storage::disk(Config::string('billing.szamlazz.disk'))->put($path, $pdf);
        }

        $invoice->forceFill([
            'status' => InvoiceStatus::Issued,
            'invoice_number' => $number,
            'pdf_path' => $path,
            'last_error' => null,
            'issued_at' => now(),
        ])->save();

        return $invoice;
    }

    /** A szamlaszambol kepzett, fajlrendszer-biztos utvonal a privat tarolon. */
    public static function pdfPath(string $number): string
    {
        return now()->format('Y').'/'.preg_replace('/[^A-Za-z0-9_-]/', '_', $number).'.pdf';
    }
}
