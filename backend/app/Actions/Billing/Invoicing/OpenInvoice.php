<?php

declare(strict_types=1);

namespace App\Actions\Billing\Invoicing;

use App\Enums\InvoiceStatus;
use App\Jobs\IssueInvoice;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Billing\Szamlazz\InvoiceAmounts;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

/**
 * Sikeres fizetes utan a szamla-sor letrehozasa es a kiallitas sorba tetele
 * (#20). A fizetes feldolgozasanak tranzakciojaban fut: a `payment_id`
 * egyedi indexe miatt egy fizeteshez akkor is csak egy sor lesz, ha a
 * sikeres allapotot tobbszor latjuk. A kiallitas csak a commit utan indul.
 */
final class OpenInvoice
{
    public function handle(Payment $payment): Invoice
    {
        $invoice = Invoice::query()->firstOrCreate(
            ['payment_id' => $payment->id],
            $this->attributes($payment),
        );

        if ($invoice->wasRecentlyCreated) {
            IssueInvoice::dispatch($invoice->id)->afterCommit();
        }

        return $invoice;
    }

    /** @return array<string, mixed> */
    private function attributes(Payment $payment): array
    {
        $user = $payment->user()->firstOrFail();
        $profile = $user->billingProfile;

        if ($profile === null) {
            // A #19 ota a fizetes elott kotelezo; ha megis hianyzik, a szamla kezi javitasra var.
            Log::critical('Invoice opened without a billing profile.', ['payment_id' => $payment->id]);
        }

        $amounts = InvoiceAmounts::fromGross($payment->amount, Config::string('billing.szamlazz.vat_rate'));

        return [
            'user_id' => $user->id,
            'provider' => Invoice::PROVIDER_SZAMLAZZ,
            'status' => InvoiceStatus::Pending,
            'buyer' => [
                'customer_type' => $profile?->customer_type->value ?? 'person',
                'name' => $profile->name ?? $user->name,
                'country' => $profile->country ?? 'HU',
                'postal_code' => $profile->postal_code ?? '',
                'city' => $profile->city ?? '',
                'address_line' => $profile->address_line ?? '',
                'tax_number' => $profile?->tax_number,
                'email' => $user->email,
            ],
            'vat_rate' => $amounts->vatRate,
            'net_amount' => $amounts->net,
            'vat_amount' => $amounts->vat,
            'gross_amount' => $amounts->gross,
            'currency' => $payment->currency,
        ];
    }
}
