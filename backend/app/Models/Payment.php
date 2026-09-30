<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentPurpose;
use App\Enums\PaymentStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property PaymentPurpose $purpose
 * @property PaymentStatus $status
 * @property CarbonImmutable|Carbon|null $paid_at
 */
final class Payment extends Model
{
    public const PROVIDER_BARION = 'barion';

    protected $fillable = [
        'user_id', 'subscription_id', 'provider', 'request_id', 'provider_payment_id',
        'recurrence_id', 'purpose', 'amount', 'currency', 'status', 'provider_status', 'paid_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'purpose' => PaymentPurpose::class,
            'status' => PaymentStatus::class,
            'amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    /** @return BelongsTo<Subscription, $this> */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
