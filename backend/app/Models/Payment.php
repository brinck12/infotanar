<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentPurpose;
use App\Enums\PaymentStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property PaymentPurpose $purpose
 * @property PaymentStatus $status
 * @property CarbonImmutable|Carbon|null $paid_at
 * @property CarbonImmutable|Carbon|null $renews_period_ending_at
 */
final class Payment extends Model
{
    public const PROVIDER_BARION = 'barion';

    /** A Barion el sem inditotta a tokenes terhelest: a kartya-token nem hasznalhato, uj kartya kell (#138). */
    public const STATUS_START_REJECTED = 'StartRejected';

    protected $fillable = [
        'user_id', 'subscription_id', 'provider', 'request_id', 'provider_payment_id',
        'recurrence_id', 'purpose', 'renews_period_ending_at', 'attempt', 'amount', 'currency', 'status', 'provider_status', 'paid_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'purpose' => PaymentPurpose::class,
            'status' => PaymentStatus::class,
            'amount' => 'integer',
            'attempt' => 'integer',
            'paid_at' => 'datetime',
            'renews_period_ending_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    /** @return HasOne<Invoice, $this> */
    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    /** @return BelongsTo<Subscription, $this> */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
