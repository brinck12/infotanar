<?php

declare(strict_types=1);

namespace App\Actions\Billing;

use App\Enums\SubscriptionNoticeType;
use App\Models\Subscription;
use App\Notifications\SubscriptionNotice;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * E-mail az elofizetonek az elofizetese valtozasarol (#137).
 *
 * A level sorbol megy, es csak a tranzakcio commitja utan; a torolt
 * (anonimizalt) felhasznalo nem kap levelet. A rendszer altal kivaltott
 * ertesitesekbol idoszakonkent egy megy ki (lasd SubscriptionNoticeType).
 */
final class NotifySubscriber
{
    public function handle(Subscription $subscription, SubscriptionNoticeType $type): void
    {
        // A kapcsolat a torolt felhasznalot nem adja vissza.
        $user = $subscription->user;

        if ($user === null) {
            return;
        }

        if ($type->oncePerPeriod() && ! $this->claim($subscription, $type)) {
            return;
        }

        $user->notify(new SubscriptionNotice($type, $this->placeholders($subscription)));
    }

    /**
     * Lefoglalja az ertesitest erre az idoszakra. Hamis, ha mar kikuldtuk:
     * az egyedi index miatt ket parhuzamos hivasbol is csak az egyik nyer.
     */
    private function claim(Subscription $subscription, SubscriptionNoticeType $type): bool
    {
        return DB::table('subscription_notices')->insertOrIgnore([
            'subscription_id' => $subscription->id,
            'type' => $type->value,
            'period_key' => $subscription->current_period_end?->toIso8601ZuluString() ?? '-',
        ]) === 1;
    }

    /**
     * A levelszovegek helyettesitoi. A kikuldes pillanataban rogzitjuk, mert a
     * level kesobb megy ki, mint ahogy az elofizetes tovabb valtozhat.
     *
     * @return array{amount: string, period_end: string, grace_end: string}
     */
    private function placeholders(Subscription $subscription): array
    {
        return [
            'amount' => number_format(Config::integer('billing.plan.price_huf'), 0, ',', ' ').' Ft',
            'period_end' => $this->day($subscription->current_period_end),
            'grace_end' => $this->day($subscription->grace_ends_at),
        ];
    }

    /** Magyar naptari nap a szamlazas idozonajaban, pl. "2026. oktober 1." */
    private function day(?CarbonInterface $moment): string
    {
        // A nyelvet az alkalmazas locale-ja (hu) adja.
        return $moment?->toImmutable()
            ->setTimezone(Config::string('billing.timezone'))
            ->isoFormat('LL') ?? '–';
    }
}
