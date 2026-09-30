<?php

declare(strict_types=1);

namespace App\Actions\Billing\Invoicing;

use App\Enums\InvoiceStatus;
use App\Exceptions\Billing\InvoiceUnavailable;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Billing\Szamlazz\InvoiceXml;
use App\Services\Billing\Szamlazz\SzamlazzClient;
use App\Services\Billing\Szamlazz\SzamlazzException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A szamla PDF-je (#20). Kiallitaskor eltaroljuk; ha ez elmaradt (pl. a
 * szamlat bizonytalan kimenetel utan rendelesszam alapjan talaltuk meg),
 * az elso letolteskor kerjuk le a Szamla Agenttol, es onnan a tarolobol.
 */
final readonly class DownloadInvoice
{
    public function __construct(private SzamlazzClient $szamlazz) {}

    /** @throws InvoiceUnavailable */
    public function handle(Payment $payment): StreamedResponse
    {
        $invoice = $payment->invoice;

        if ($invoice === null || $invoice->status !== InvoiceStatus::Issued || $invoice->invoice_number === null) {
            throw InvoiceUnavailable::notReady();
        }

        $disk = Storage::disk(Config::string('billing.szamlazz.disk'));
        $path = $invoice->pdf_path;

        if ($path === null || ! $disk->exists($path)) {
            $path = $this->fetch($invoice, $invoice->invoice_number);
        }

        $response = $disk->download($path, 'szamla-'.$invoice->invoice_number.'.pdf', ['Content-Type' => 'application/pdf']);
        $response->setPrivate();
        $response->headers->addCacheControlDirective('no-store');

        return $response;
    }

    /** @throws InvoiceUnavailable */
    private function fetch(Invoice $invoice, string $number): string
    {
        try {
            $pdf = $this->szamlazz->pdf(InvoiceXml::pdf($this->szamlazz->agentKey(), $number));
        } catch (SzamlazzException $e) {
            Log::warning('Invoice PDF could not be fetched.', ['invoice_id' => $invoice->id, 'error' => $e->getMessage()]);

            throw InvoiceUnavailable::providerDown();
        }

        $path = IssuePendingInvoice::pdfPath($number);
        Storage::disk(Config::string('billing.szamlazz.disk'))->put($path, $pdf);
        $invoice->forceFill(['pdf_path' => $path])->save();

        return $path;
    }
}
