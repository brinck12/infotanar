<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Meghivokod a zart beta regisztraciojahoz. Akkor hasznalhato, ha nincs
 * letiltva, nem jart le es a felhasznalasok szama nem ertek el a korlatot.
 *
 * @property int $uses
 * @property int|null $max_uses
 * @property CarbonImmutable|Carbon|null $expires_at
 * @property CarbonImmutable|Carbon|null $disabled_at
 */
final class InviteCode extends Model
{
    protected $fillable = ['code', 'label', 'max_uses', 'expires_at', 'created_by'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'max_uses' => 'integer',
            'uses' => 'integer',
            'expires_at' => 'datetime',
            'disabled_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    /** Az allapot: disabled, expired, used_up vagy active (ebben a sorrendben). */
    public function state(): string
    {
        return match (true) {
            $this->disabled_at !== null => 'disabled',
            $this->expires_at !== null && $this->expires_at->isPast() => 'expired',
            $this->max_uses !== null && $this->uses >= $this->max_uses => 'used_up',
            default => 'active',
        };
    }

    public function isUsable(): bool
    {
        return $this->state() === 'active';
    }

    /** A kodot mindig nagybetusen, szokozok nelkul taroljuk es keressuk. */
    public static function normalize(string $code): string
    {
        return strtoupper(preg_replace('/\s+/', '', $code) ?? '');
    }
}
