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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Egy esedekes elofizetes megujitasa a tarolt kartyaval (#98, ADR 0001).
 *
 * Egy idoszakra tobb terhelesi kiserlet is lehet (#138): ha az elso
 * elutasitasra fut (pl. nincs fedezet), a turelmi ido alatt a beallitott
 * napokon ujra megprobaljuk. Egy kiserlethez viszont pontosan egy fizetes-sor
 * tartozik (egyedi index), es az elobb jon letre, mint a Barion-hivas.
 * Ujrafuttataskor (job retry, parhuzamos sweep) ugyanazt a sort talaljuk meg:
 * ha mar elindult vagy lezarult, ugyanazt a kiserletet nem terheljuk ujra.
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
            // A legutobbi kiserlet mar lezarult, es uj meg nem esedekes: sikernel nincs
            // teendo, kudarcnal (pl. elhagyott inditas) a turelmi ido indul.
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
                    // A Barion el sem inditotta a terhelest (pl. lejart/letiltott kartya-token):
                    // ez nem atmeneti hiba, ujraprobalni sem erdemes, uj kartya kell.
                    $payment->update(['status' => PaymentStatus::Failed, 'provider_status' => Payment::STATUS_START_REJECTED]);
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

    /**
     * A lejart idoszakra szolo, most feldolgozando fizetes: az elso kiserlet, egy
     * folyamatban levo, vagy (ha esedekes) egy uj ujraprobalkozas. Null, ha az
     * elofizetes nem terhelheto.
     */
    private function openPayment(Subscription $subscription): ?Payment
    {
        return DB::transaction(function () use ($subscription): ?Payment {
            $locked = Subscription::query()->lockForUpdate()->find($subscription->id);

            if ($locked === null || ! self::isChargeable($locked)) {
                return null;
            }

            $attempts = Payment::query()
                ->where('subscription_id', $locked->id)
                ->where('renews_period_ending_at', $locked->current_period_end)
                ->orderBy('attempt')
                ->get();

            $latest = $attempts->last();

            if ($latest === null) {
                return $this->createAttempt($locked, 1);
            }

            return $this->retryIsDue($attempts) ? $this->createAttempt($locked, $latest->attempt + 1) : $latest;
        });
    }

    /**
     * Ujraprobalkozas akkor esedekes, ha a legutobbi kiserlet elutasitasra futott
     * (de a kartya-token meg hasznalhato), es az elso kudarc ota eltelt a
     * kovetkezo kiserlethez beallitott napok szama.
     *
     * @param  Collection<int, Payment>  $attempts  a kiserletek sorrendben, legalabb egy
     */
    private function retryIsDue(Collection $attempts): bool
    {
        $first = $attempts->firstOrFail();
        $latest = $attempts->last() ?? $first;

        if ($latest->status === PaymentStatus::Pending || $latest->status === PaymentStatus::Succeeded) {
            return false;
        }

        if ($latest->provider_status === Payment::STATUS_START_REJECTED) {
            return false;
        }

        $retryAfterDays = Config::array('billing.dunning.retry_days')[$attempts->count() - 1] ?? null;

        return is_int($retryAfterDays)
            && $first->created_at !== null
            && $first->created_at->copy()->addDays($retryAfterDays)->isPast();
    }

    private function createAttempt(Subscription $subscription, int $attempt): Payment
    {
        $period = [
            'subscription_id' => $subscription->id,
            'renews_period_ending_at' => $subscription->current_period_end,
            'attempt' => $attempt,
        ];

        try {
            return Payment::create([
                ...$period,
                'user_id' => $subscription->user_id,
                'provider' => Payment::PROVIDER_BARION,
                'request_id' => (string) Str::uuid(),
                'recurrence_id' => (string) $subscription->provider_subscription_id,
                'purpose' => PaymentPurpose::Renewal,
                'amount' => Config::integer('billing.plan.price_huf'),
                'currency' => 'HUF',
                'status' => PaymentStatus::Pending,
            ]);
        } catch (UniqueConstraintViolationException) {
            // Egy parhuzamos futas megelozott minket: az o sorat hasznaljuk.
            return Payment::query()->where($period)->firstOrFail();
        }
    }

    /**
     * Lejart idoszaku, nem lemondott, tarolt kartya-tokennel rendelkezo elofizetes,
     * amely aktiv (elso kiserlet) vagy a turelmi idejen belul van (ujraprobalkozas).
     */
    public static function isChargeable(Subscription $subscription): bool
    {
        $inGracePeriod = $subscription->status === SubscriptionStatus::PastDue
            && $subscription->grace_ends_at?->isFuture() === true;

        return ($subscription->status === SubscriptionStatus::Active || $inGracePeriod)
            && ! $subscription->cancel_at_period_end
            && $subscription->provider === Payment::PROVIDER_BARION
            && $subscription->provider_subscription_id !== null
            && $subscription->current_period_end !== null
            && $subscription->current_period_end->isPast();
    }
}
