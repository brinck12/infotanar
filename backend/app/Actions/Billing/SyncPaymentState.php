<?php

declare(strict_types=1);

namespace App\Actions\Billing;

use App\Actions\Billing\Invoicing\OpenInvoice;
use App\Enums\PaymentPurpose;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\Billing\Barion\BarionClient;
use App\Services\Billing\Barion\BarionException;
use App\Services\Billing\Barion\PaymentStateSnapshot;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Egy fizetes allapotanak atvetele a Barionbol es a hatasa az elofizetesre
 * (#15). A Barion callbackje alairatlan, ezert az allapotot mindig a Barion
 * API-bol kerdezzuk le (ADR 0001); a hivo csak azt mondja meg, melyik
 * fizetest nezzuk meg.
 *
 * Idempotens: a fizetes-sort zarolva dolgozzuk fel, es vegleges allapotu
 * fizetest nem nyitunk ujra, igy egy ujrakuldott vagy parhuzamos callback
 * a hatast (elofizetes inditasa/hosszabbitasa, past_due) csak egyszer valtja ki.
 */
final readonly class SyncPaymentState
{
    public function __construct(
        private BarionClient $barion,
        private ReactivateSubscription $reactivate,
        private MarkSubscriptionPastDue $markPastDue,
        private OpenInvoice $openInvoice,
    ) {}

    /** @throws BarionException */
    public function handle(Payment $payment): Payment
    {
        if ($payment->status->isFinal() || $payment->provider_payment_id === null) {
            return $payment;
        }

        // A halozati hivas a zar elott tortenik, hogy ne tartsunk nyitva tranzakciot rajta.
        $snapshot = $this->barion->paymentState($payment->provider_payment_id);

        if (! $this->matches($payment, $snapshot)) {
            return $payment;
        }

        return DB::transaction(function () use ($payment, $snapshot): Payment {
            $locked = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($locked->status->isFinal()) {
                return $locked;
            }

            $status = PaymentStatus::fromBarion($snapshot->status);
            $locked->fill(['status' => $status, 'provider_status' => $snapshot->status]);

            match ($status) {
                PaymentStatus::Pending => null,
                PaymentStatus::Succeeded => $this->applySuccess($locked, $snapshot),
                PaymentStatus::Failed, PaymentStatus::Canceled, PaymentStatus::Expired => $this->applyFailure($locked),
            };

            $locked->save();

            return $locked;
        });
    }

    /**
     * Vedelem a felcserelt vagy hamisitott azonositok ellen: a Barion altal
     * visszaadott fizetesnek pontosan a mi kereskedesunknek kell lennie.
     */
    private function matches(Payment $payment, PaymentStateSnapshot $snapshot): bool
    {
        $ok = $snapshot->paymentId === $payment->provider_payment_id
            && $snapshot->paymentRequestId === $payment->request_id
            && ($snapshot->total === null || $snapshot->total === $payment->amount)
            && ($snapshot->currency === null || $snapshot->currency === $payment->currency);

        if (! $ok) {
            Log::critical('Barion: payment state does not match the stored payment; ignored.', [
                'payment_id' => $payment->id,
                'barion_payment_id' => $snapshot->paymentId,
            ]);
        }

        return $ok;
    }

    private function applySuccess(Payment $payment, PaymentStateSnapshot $snapshot): void
    {
        $payment->paid_at = now();

        $cardRegistered = $payment->purpose->registersCard() && $snapshot->recurrenceResult === 'Successful';

        if ($payment->purpose->registersCard() && ! $cardRegistered) {
            // A penz megjott, de a kartya nem regisztralodott: erre a tokenre nem lehet megujitani.
            Log::warning('Barion: card token was not registered with the payment.', [
                'payment_id' => $payment->id,
                'recurrence_result' => $snapshot->recurrenceResult,
            ]);
        }

        // Ha a hozzatartozo elofizetes kozben lezarult, a befizetes nem veszhet el:
        // az elo elofizetest hosszabbitja, ha nincs ilyen, a lezartat eleszti ujra.
        $linked = $payment->purpose->continuesSubscription() ? $payment->subscription : null;
        $subscription = $linked?->isLive() === true
            ? $linked
            : ($this->liveSubscriptionOf($payment) ?? $linked);

        if ($subscription === null) {
            $subscription = $this->startSubscription($payment);
        } else {
            // Megujitas, vagy ket parhuzamos elso fizetesbol a masodik: a fizetett
            // idoszak a meglevo vegehez adodik, nem vesz el.
            $start = $this->laterOf($subscription->current_period_end, now());
            $this->reactivate->handle($subscription, $start, $this->periodEnd($start));

            if ($payment->purpose === PaymentPurpose::CardChange && $cardRegistered) {
                // Kartyacsere (#17): a tovabbi megujitasok mar az uj tokent terhelik.
                $subscription->forceFill(['provider_subscription_id' => $payment->recurrence_id])->save();
            }
        }

        $payment->subscription()->associate($subscription);

        // Minden sikeres terhelesrol pontosan egy szamla (#20); kiallitas a commit utan.
        $this->openInvoice->handle($payment);
    }

    private function applyFailure(Payment $payment): void
    {
        // Csak a megujitas kudarca erinti az elofizetest: az elso fizetesnel meg nincs
        // mit visszavonni, sikertelen kartyacsere utan pedig a regi kartya marad.
        if ($payment->purpose === PaymentPurpose::Renewal && $payment->subscription !== null) {
            $this->markPastDue->handle($payment->subscription);
        }
    }

    private function startSubscription(Payment $payment): Subscription
    {
        $start = now();

        return Subscription::create([
            'user_id' => $payment->user_id,
            'provider' => $payment->provider,
            // Barionnal nincs szolgaltatoi elofizetes-objektum: a token a RecurrenceId.
            'provider_subscription_id' => $payment->recurrence_id,
            'status' => SubscriptionStatus::Active,
            'current_period_start' => $start,
            'current_period_end' => $this->periodEnd($start),
        ]);
    }

    private function liveSubscriptionOf(Payment $payment): ?Subscription
    {
        return Subscription::query()->live()->where('user_id', $payment->user_id)->lockForUpdate()->first();
    }

    private function periodEnd(CarbonInterface $start): CarbonInterface
    {
        return $start->copy()->addMonthsNoOverflow(Config::integer('billing.plan.period_months'));
    }

    private function laterOf(?CarbonInterface $a, CarbonInterface $b): CarbonInterface
    {
        return $a !== null && $a->greaterThan($b) ? $a : $b;
    }
}
