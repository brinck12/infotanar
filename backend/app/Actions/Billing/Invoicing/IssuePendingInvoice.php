<?php

declare(strict_types=1);

namespace App\Actions\Billing\Invoicing;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use App\Services\Billing\Szamlazz\InvoiceDates;
use App\Services\Billing\Szamlazz\InvoiceXml;
use App\Services\Billing\Szamlazz\SzamlazzClient;
use App\Services\Billing\Szamlazz\SzamlazzException;
use App\Support\Alerts\OperatorAlert;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Config;
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
    public function __construct(
        private SzamlazzClient $szamlazz,
        private OperatorAlert $alert,
    ) {}

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
                // Egy korabbi, bizonytalan kimenetelu kiserlet allitotta ki; a pontos idopontjat nem ismerjuk.
                return $this->markIssued($invoice, $existing, null, now());
            }
        }

        $invoice->increment('attempts');
        $prefix = Config::get('billing.szamlazz.invoice_prefix');

        // Egy oraallas: a szamlan szereplo kelt es a sajat issued_at ugyanarra a pillanatra esik.
        $issuedAt = now();
        $dates = InvoiceDates::in(Config::string('billing.timezone'), $issuedAt, $payment->paid_at ?? $issuedAt);

        try {
            $issued = $this->szamlazz->issue(InvoiceXml::issue($invoice, $agentKey, $payment->request_id, $dates, [
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
                $this->alert->raise(__('alerts.invoice_rejected'), ['invoice_id' => $invoice->id]);

                return $invoice;
            }

            throw $e;
        }

        return $this->markIssued($invoice, $issued->number, $issued->pdf, $issuedAt);
    }

    private function markIssued(Invoice $invoice, string $number, ?string $pdf, CarbonInterface $issuedAt): Invoice
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
            'issued_at' => $issuedAt,
        ])->save();

        return $invoice;
    }

    /** A szamlaszambol kepzett, fajlrendszer-biztos utvonal a privat tarolon. */
    public static function pdfPath(string $number): string
    {
        return now()->format('Y').'/'.preg_replace('/[^A-Za-z0-9_-]/', '_', $number).'.pdf';
    }
}
