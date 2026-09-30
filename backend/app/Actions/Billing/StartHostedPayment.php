<?php

declare(strict_types=1);

namespace App\Actions\Billing;

use App\Enums\PaymentPurpose;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\Barion\BarionClient;
use App\Services\Billing\Barion\BarionException;
use App\Services\Billing\Barion\PaymentRequestFactory;
use App\Services\Billing\Barion\StartedPayment;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

/**
 * Egy havidij kifizetese a Barion fizetooldalan, uj kartya-tokennel. Az
 * elso fizetes (#14) es a kartyacsere (#17) kozos resze: elobb a sajat
 * fizetes-sor (a callback erre talal ra), csak utana a szolgaltato.
 */
final readonly class StartHostedPayment
{
    public function __construct(
        private BarionClient $barion,
        private PaymentRequestFactory $requests,
    ) {}

    /** @throws BarionException */
    public function handle(User $user, PaymentPurpose $purpose, ?Subscription $subscription = null): StartedPayment
    {
        // Hianyzo beallitasnal ne maradjon utana ervenytelen fizetes-sor.
        $this->barion->payee();

        $payment = Payment::create([
            'user_id' => $user->id,
            'subscription_id' => $subscription?->id,
            'provider' => Payment::PROVIDER_BARION,
            'request_id' => (string) Str::uuid(),
            // Boltonkent es felhasznalonkent egyedi, max. 100 karakter (Barion).
            'recurrence_id' => 'u'.$user->id.'-'.Str::uuid(),
            'purpose' => $purpose,
            'amount' => Config::integer('billing.plan.price_huf'),
            'currency' => 'HUF',
            'status' => PaymentStatus::Pending,
        ]);

        try {
            $started = $this->barion->startPayment($this->requests->withCardRegistration($payment, $user));
        } catch (BarionException $e) {
            $payment->update(['status' => PaymentStatus::Failed, 'provider_status' => 'StartFailed']);

            throw $e;
        }

        $payment->update(['provider_payment_id' => $started->paymentId, 'provider_status' => $started->status]);

        return $started;
    }
}
