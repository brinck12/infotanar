<?php

declare(strict_types=1);

namespace App\Actions\Billing;

use App\Actions\Consent\RecordConsent;
use App\Enums\ConsentType;
use App\Enums\PaymentPurpose;
use App\Exceptions\Billing\CheckoutNotAllowed;
use App\Models\Payment;
use App\Models\User;
use App\Services\Billing\Barion\BarionException;
use App\Services\Billing\Barion\StartedPayment;

/**
 * Elofizetes inditasa (#14): a vasarlot a Barion fizetooldalara kuldjuk,
 * ahol kifizeti az elso honapot, es a kartyaja tokenkent regisztralodik a
 * havi megujitasokhoz (ADR 0001). Az elofizetes a sikeres fizetesrol szolo
 * callback utan jon letre (#15), nem itt.
 */
final readonly class StartCheckout
{
    public function __construct(
        private StartHostedPayment $startHostedPayment,
        private RecordConsent $recordConsent,
    ) {}

    /**
     * @param  string  $termsVersion  az ASZF verzioja, amely mellett a vasarlo az azonnali teljesitest kerte (#133)
     *
     * @throws CheckoutNotAllowed
     * @throws BarionException
     */
    public function handle(User $user, string $termsVersion): StartedPayment
    {
        if (! $user->hasVerifiedEmail()) {
            throw CheckoutNotAllowed::emailNotVerified();
        }

        if ($user->liveSubscription !== null) {
            throw CheckoutNotAllowed::alreadySubscribed();
        }

        $started = $this->startHostedPayment->handle($user, PaymentPurpose::Initial);

        // A nyilatkozat ahhoz a fizeteshez tartozik, amelyik most indult el.
        $payment = Payment::query()
            ->where('provider', Payment::PROVIDER_BARION)
            ->where('provider_payment_id', $started->paymentId)
            ->first();

        $this->recordConsent->handle($user, ConsentType::ImmediatePerformance, $termsVersion, $payment);

        return $started;
    }
}
