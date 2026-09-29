<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Carbon\CarbonImmutable;
use Database\Factories\SubscriptionFactory;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Egy felhasznalonak egyszerre legfeljebb egy elo (active/past_due)
 * elofizetese lehet; ezt a `live_user_id` generalt oszlop egyedi indexe
 * kenyszeriti ki (lasd a migraciot). A lezart elofizetesek tortenetkent
 * megmaradnak.
 *
 * @property SubscriptionStatus $status
 * @property CarbonImmutable|Carbon|null $current_period_start
 * @property CarbonImmutable|Carbon|null $current_period_end
 * @property CarbonImmutable|Carbon|null $grace_ends_at
 * @property CarbonImmutable|Carbon|null $canceled_at
 */
final class Subscription extends Model
{
    /** @use HasFactory<SubscriptionFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'provider',
        'provider_customer_id',
        'provider_subscription_id',
        'status',
        'current_period_start',
        'current_period_end',
        'cancel_at_period_end',
        'grace_ends_at',
        'canceled_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
            'cancel_at_period_end' => 'boolean',
            'grace_ends_at' => 'datetime',
            'canceled_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @param Builder<Subscription> $query */
    #[Scope]
    protected function live(Builder $query): void
    {
        $query->whereIn('status', SubscriptionStatus::live());
    }

    public function isLive(): bool
    {
        return $this->status->isLive();
    }

    /**
     * Ad-e most premium hozzaferest. A past_due allapotot is az ido alapjan
     * donti el, nem a sweep lefutasatol fugg, igy a hozzaferes percre pontosan
     * a turelmi ido vegen szunik meg.
     */
    public function grantsAccess(): bool
    {
        return match ($this->status) {
            SubscriptionStatus::Active => true,
            SubscriptionStatus::PastDue => $this->grace_ends_at?->isFuture() ?? false,
            SubscriptionStatus::Canceled => false,
        };
    }

    /** Helyi lezaras; a szolgaltatonal valo lemondas a szolgaltato-integracio dolga (#14+). */
    public function cancel(): void
    {
        $this->forceFill([
            'status' => SubscriptionStatus::Canceled,
            'canceled_at' => now(),
            'cancel_at_period_end' => false,
        ])->save();
    }
}
