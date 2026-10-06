<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ConsentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Egy elfogadott nyilatkozat (#133). Csak letrejon, nem modosul.
 *
 * @property ConsentType $type
 */
final class Consent extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'type', 'document_version', 'payment_id', 'ip_address', 'user_agent'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['type' => ConsentType::class];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    /** @return BelongsTo<Payment, $this> */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
