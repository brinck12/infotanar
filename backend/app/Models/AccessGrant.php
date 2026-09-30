<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Kezi premium hozzaferes. Akkor ervenyes, ha nincs visszavonva es nem
 * jart le (ends_at NULL = hatarozatlan ideig).
 *
 * @property CarbonImmutable|Carbon|null $ends_at
 * @property CarbonImmutable|Carbon|null $revoked_at
 */
final class AccessGrant extends Model
{
    protected $fillable = ['user_id', 'granted_by', 'reason', 'ends_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'ends_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by')->withTrashed();
    }

    /** @return BelongsTo<User, $this> */
    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by')->withTrashed();
    }

    /** @param Builder<AccessGrant> $query */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->whereNull('revoked_at')
            ->where(static fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()));
    }

    public function isActive(): bool
    {
        return $this->revoked_at === null && ($this->ends_at === null || $this->ends_at->isFuture());
    }
}
