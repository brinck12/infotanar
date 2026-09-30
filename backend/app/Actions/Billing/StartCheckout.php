<?php

declare(strict_types=1);

namespace App\Actions\Billing;

use App\Enums\PaymentPurpose;
use App\Exceptions\Billing\CheckoutNotAllowed;
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
    public function __construct(private StartHostedPayment $startHostedPayment) {}

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

        return $this->startHostedPayment->handle($user, PaymentPurpose::Initial);
    }
}
