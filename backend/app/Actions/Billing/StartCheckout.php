<?php

declare(strict_types=1);

namespace App\Actions\Billing;

use App\Enums\PaymentPurpose;
use App\Enums\PaymentStatus;
use App\Exceptions\Billing\CheckoutNotAllowed;
use App\Models\Payment;
use App\Models\User;
use App\Services\Billing\Barion\BarionClient;
use App\Services\Billing\Barion\BarionException;
use App\Services\Billing\Barion\StartedPayment;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

/**
 * Elofizetes inditasa (#14): a vasarlot a Barion fizetooldalara kuldjuk,
 * ahol kifizeti az elso honapot, es a kartyaja tokenkent regisztralodik a
 * havi megujitasokhoz (ADR 0001). Az elofizetes a sikeres fizetesrol szolo
 * callback utan jon letre (#15), nem itt.
 */
final readonly class StartCheckout
{
    public function __construct(private BarionClient $barion) {}

    /**
     * @throws CheckoutNotAllowed
     * @throws BarionException
     */
    public function handle(User $user): StartedPayment
    {
        if (! $user->hasVerifiedEmail()) {
            throw CheckoutNotAllowed::emailNotVerified();
        }

        if ($user->liveSubscription !== null) {
            throw CheckoutNotAllowed::alreadySubscribed();
        }

        $price = Config::integer('billing.plan.price_huf');
        // Hianyzo beallitasnal ne maradjon utana ervenytelen fizetes-sor.
        $payee = $this->barion->payee();

        // Elobb a sajat sor (a callback mar erre talal ra), csak utana a szolgaltato.
        $payment = Payment::create([
            'user_id' => $user->id,
            'provider' => Payment::PROVIDER_BARION,
            'request_id' => (string) Str::uuid(),
            // Boltonkent es felhasznalonkent egyedi, max. 100 karakter (Barion).
            'recurrence_id' => 'u'.$user->id.'-'.Str::uuid(),
            'purpose' => PaymentPurpose::Initial,
            'amount' => $price,
            'currency' => 'HUF',
            'status' => PaymentStatus::Pending,
        ]);

        try {
            $started = $this->barion->startPayment($this->payload($payment, $user, $price, $payee));
        } catch (BarionException $e) {
            $payment->update(['status' => PaymentStatus::Failed, 'provider_status' => 'StartFailed']);

            throw $e;
        }

        $payment->update(['provider_payment_id' => $started->paymentId, 'provider_status' => $started->status]);

        return $started;
    }

    /** @return array<string, mixed> */
    private function payload(Payment $payment, User $user, int $price, string $payee): array
    {
        $plan = Config::string('billing.plan.name');

        return [
            'PaymentType' => 'Immediate',
            'GuestCheckOut' => true,
            'FundingSources' => ['All'],
            'PaymentRequestId' => $payment->request_id,
            'PayerHint' => $user->email,
            'Locale' => 'hu-HU',
            'Currency' => 'HUF',
            'InitiateRecurrence' => true,
            'RecurrenceId' => $payment->recurrence_id,
            'RecurrenceType' => 'RecurringPayment',
            'RedirectUrl' => Config::string('app.frontend_url').'/elofizetes/visszateres?fizetes='.$payment->request_id,
            'CallbackUrl' => route('api.webhooks.barion'),
            'Transactions' => [[
                'POSTransactionId' => $payment->request_id,
                'Payee' => $payee,
                'Total' => $price,
                'Items' => [[
                    'Name' => $plan,
                    'Description' => $plan,
                    'Quantity' => 1,
                    'Unit' => 'hónap',
                    'UnitPrice' => $price,
                    'ItemTotal' => $price,
                ]],
            ]],
        ];
    }
}
