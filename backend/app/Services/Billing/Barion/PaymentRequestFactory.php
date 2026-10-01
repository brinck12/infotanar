<?php

declare(strict_types=1);

namespace App\Services\Billing\Barion;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\Config;

/**
 * A Barion Payment/Start torzse egy nalunk mar letrehozott fizetes-sorbol.
 * Egy helyen, hogy az elso fizetes (#14) es a kartyacsere (#17) ugyanazt a
 * tetelt, cimzettet es visszateresi utat hasznalja.
 */
final readonly class PaymentRequestFactory
{
    public function __construct(private BarionClient $barion) {}

    /**
     * A vasarlo a Barion oldalan fizet, es a kartyaja a fizetes RecurrenceId-jan
     * tokenkent regisztralodik a kesobbi, jelenlete nelkuli terhelesekhez.
     *
     * @return array<string, mixed>
     *
     * @throws BarionException
     */
    public function withCardRegistration(Payment $payment, User $user): array
    {
        $plan = Config::string('billing.plan.name');

        return [
            'PaymentType' => 'Immediate',
            'GuestCheckOut' => true,
            'FundingSources' => ['All'],
            'PaymentRequestId' => $payment->request_id,
            'PayerHint' => $user->email,
            'Locale' => 'hu-HU',
            'Currency' => $payment->currency,
            'InitiateRecurrence' => true,
            'RecurrenceId' => $payment->recurrence_id,
            'RecurrenceType' => 'RecurringPayment',
            'RedirectUrl' => Config::string('app.frontend_url').'/elofizetes/visszateres?fizetes='.$payment->request_id,
            'CallbackUrl' => route('api.webhooks.barion'),
            'Transactions' => [[
                'POSTransactionId' => $payment->request_id,
                'Payee' => $this->barion->payee(),
                'Total' => $payment->amount,
                'Items' => [[
                    'Name' => $plan,
                    'Description' => $plan,
                    'Quantity' => 1,
                    'Unit' => 'hónap',
                    'UnitPrice' => $payment->amount,
                    'ItemTotal' => $payment->amount,
                ]],
            ]],
        ];
    }

    /**
     * Megujitas a tarolt kartyaval (ADR 0001): ugyanaz a RecurrenceId, uj token
     * regisztracio nelkul; a vasarlo nincs jelen, ezert nincs RedirectUrl.
     *
     * @return array<string, mixed>
     *
     * @throws BarionException
     */
    public function recurringCharge(Payment $payment, User $user): array
    {
        $plan = Config::string('billing.plan.name');

        return [
            'PaymentType' => 'Immediate',
            'GuestCheckOut' => true,
            'FundingSources' => ['All'],
            'PaymentRequestId' => $payment->request_id,
            'PayerHint' => $user->email,
            'Locale' => 'hu-HU',
            'Currency' => $payment->currency,
            'InitiateRecurrence' => false,
            'RecurrenceId' => $payment->recurrence_id,
            'RecurrenceType' => 'RecurringPayment',
            'CallbackUrl' => route('api.webhooks.barion'),
            'Transactions' => [[
                'POSTransactionId' => $payment->request_id,
                'Payee' => $this->barion->payee(),
                'Total' => $payment->amount,
                'Items' => [[
                    'Name' => $plan,
                    'Description' => $plan,
                    'Quantity' => 1,
                    'Unit' => 'hónap',
                    'UnitPrice' => $payment->amount,
                    'ItemTotal' => $payment->amount,
                ]],
            ]],
        ];
    }
}
