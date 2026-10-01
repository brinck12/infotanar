<?php

declare(strict_types=1);

namespace App\Actions\Billing;

use App\Enums\PaymentPurpose;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\Billing\Barion\BarionClient;
use App\Services\Billing\Barion\BarionException;
use App\Services\Billing\Barion\PaymentRequestFactory;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Egy esedekes elofizetes megujitasa a tarolt kartyaval (#98, ADR 0001).
 *
 * Pontosan egy terheles idoszakonkent: a fizetes-sor a lejaro idoszak
 * vegehez kotott (egyedi index), es elobb jon letre, mint a Barion-hivas.
 * Ujrafuttataskor (job retry, parhuzamos sweep) ugyanazt a sort talaljuk
 * meg: ha mar elindult vagy lezarult, nem terhelunk ujra.
 *
 * A Barion valasza utan az eredmenyt ugyanaz a SyncPaymentState dolgozza
 * fel, mint a callbacket: siker eseten az idoszak hosszabbodik, elutasitasnal
 * az elofizetes past_due lesz (turelmi ido, #16).
 */
final readonly class ChargeRenewal
{
    public function __construct(
        private BarionClient $barion,
        private PaymentRequestFactory $requests,
        private SyncPaymentState $sync,
        private MarkSubscriptionPastDue $markPastDue,
    ) {}

    /** @throws BarionException atmeneti Barion-hiba eseten (a job ujraprobalja) */
    public function handle(Subscription $subscription): ?Payment
    {
        $payment = $this->openPayment($subscription);

        if ($payment === null) {
            return null;
        }

        if ($payment->status->isFinal()) {
            // Egy korabbi kiserlet mar lezarult erre az idoszakra: sikernel nincs teendo,
            // kudarcnal (pl. elhagyott inditas) a turelmi ido indul, ujraterheles nincs.
            if ($payment->status !== PaymentStatus::Succeeded) {
                $this->markPastDue->handle($subscription);
            }

            return $payment;
        }

        if ($payment->provider_payment_id === null) {
            try {
                $started = $this->barion->startPayment($this->requests->recurringCharge($payment, $subscription->user()->withTrashed()->firstOrFail()));
            } catch (BarionException $e) {
                if ($e->status() === 502) {
                    // A Barion elutasitotta (pl. lejart/letiltott kartya): ez kudarc, nem atmeneti hiba.
                    $payment->update(['status' => PaymentStatus::Failed, 'provider_status' => 'StartRejected']);
                    $this->markPastDue->handle($subscription);
                    Log::warning('Renewal charge rejected by Barion.', ['subscription_id' => $subscription->id]);

                    return $payment;
                }

                throw $e;
            }

            $payment->update(['provider_payment_id' => $started->paymentId, 'provider_status' => $started->status]);
        }

        // A tokenes terheles altalaban azonnal eldol; ha meg fuggo, a callback vagy a sweep lezarja.
        return $this->sync->handle($payment);
    }

    /** A lejaro idoszakra szolo megujitasi fizetes, szukseg eseten letrehozva. */
    private function openPayment(Subscription $subscription): ?Payment
    {
        return DB::transaction(function () use ($subscription): ?Payment {
            $locked = Subscription::query()->lockForUpdate()->find($subscription->id);

            if ($locked === null || ! self::isDue($locked)) {
                return null;
            }

            $periodEnd = $locked->current_period_end;

            $existing = Payment::query()
                ->where('subscription_id', $locked->id)
                ->where('renews_period_ending_at', $periodEnd)
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            try {
                return Payment::create([
                    'user_id' => $locked->user_id,
                    'subscription_id' => $locked->id,
                    'provider' => Payment::PROVIDER_BARION,
                    'request_id' => (string) Str::uuid(),
                    'recurrence_id' => (string) $locked->provider_subscription_id,
                    'purpose' => PaymentPurpose::Renewal,
                    'renews_period_ending_at' => $periodEnd,
                    'amount' => Config::integer('billing.plan.price_huf'),
                    'currency' => 'HUF',
                    'status' => PaymentStatus::Pending,
                ]);
            } catch (UniqueConstraintViolationException) {
                // Egy parhuzamos futas megelozott minket: az o sorat hasznaljuk.
                return Payment::query()
                    ->where('subscription_id', $locked->id)
                    ->where('renews_period_ending_at', $periodEnd)
                    ->firstOrFail();
            }
        });
    }

    /** Aktiv, lejart idoszaku, nem lemondott, es van tarolt kartya-tokenje. */
    public static function isDue(Subscription $subscription): bool
    {
        return $subscription->status === SubscriptionStatus::Active
            && ! $subscription->cancel_at_period_end
            && $subscription->provider === Payment::PROVIDER_BARION
            && $subscription->provider_subscription_id !== null
            && $subscription->current_period_end !== null
            && $subscription->current_period_end->isPast();
    }
}
