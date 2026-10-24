<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Kozossegi belepes (jelenleg Google) osszekotese egy fiokkal. Csak a
 * szolgaltato stabil azonositojat tarolja, tokent nem.
 *
 * @property string $provider
 * @property string $provider_user_id
 */
final class SocialAccount extends Model
{
    protected $fillable = ['user_id', 'provider', 'provider_user_id'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
