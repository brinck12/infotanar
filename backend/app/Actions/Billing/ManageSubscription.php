<?php

declare(strict_types=1);

namespace App\Actions\Billing;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Enums\PaymentPurpose;
use App\Exceptions\Billing\SubscriptionNotManageable;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\Barion\BarionException;
use App\Services\Billing\Barion\StartedPayment;
use Illuminate\Support\Facades\DB;

/**
 * Onkiszolgalo elofizetes-kezeles (#17). A Barionnak nincs ugyfelportalja
 * (ADR 0001), mert az elofizetest mi vezetjuk: a lemondas csak azt jelenti,
 * hogy tobbet nem terheljuk a kartyat (#98), a kartyacsere pedig egy uj,
 * tokent regisztralo fizetes a Barion oldalan.
 */
final readonly class ManageSubscription
{
    public function __construct(
        private StartHostedPayment $startHostedPayment,
        private RecordAuditEvent $audit,
    ) {}

    /**
     * Lemondas az idoszak vegere: a mar kifizetett idoszak vegeig (illetve
     * past_due eseten a turelmi ido vegeig) megmarad a hozzaferes.
     *
     * @throws SubscriptionNotManageable
     */
    public function cancelAtPeriodEnd(User $user): Subscription
    {
        return DB::transaction(function () use ($user): Subscription {
            $subscription = $this->lockLive($user);

            if ($subscription->cancel_at_period_end) {
                throw SubscriptionNotManageable::alreadyCanceling();
            }

            $subscription->forceFill(['cancel_at_period_end' => true])->save();
            $this->audit->handle(AuditAction::SubscriptionCancelScheduled, $user, $subscription);

            return $subscription;
        });
    }

    /** @throws SubscriptionNotManageable */
    public function resume(User $user): Subscription
    {
        return DB::transaction(function () use ($user): Subscription {
            $subscription = $this->lockLive($user);

            if (! $subscription->cancel_at_period_end) {
                throw SubscriptionNotManageable::notCanceling();
            }

            $subscription->forceFill(['cancel_at_period_end' => false])->save();
            $this->audit->handle(AuditAction::SubscriptionResumed, $user, $subscription);

            return $subscription;
        });
    }

    /**
     * Kartyacsere: a kovetkezo honap elore kifizetese az uj kartyaval. Siker
     * eseten (callback, #15) az idoszak egy honappal hosszabbodik, past_due
     * elofizetes ujra active lesz, es a megujitasok az uj kartyat terhelik.
     *
     * @throws SubscriptionNotManageable
     * @throws BarionException
     */
    public function changeCard(User $user): StartedPayment
    {
        $subscription = $user->liveSubscription ?? throw SubscriptionNotManageable::notSubscribed();

        return $this->startHostedPayment->handle($user, PaymentPurpose::CardChange, $subscription);
    }

    /** @throws SubscriptionNotManageable */
    private function lockLive(User $user): Subscription
    {
        return Subscription::query()->live()->whereBelongsTo($user)->lockForUpdate()->first()
            ?? throw SubscriptionNotManageable::notSubscribed();
    }
}
