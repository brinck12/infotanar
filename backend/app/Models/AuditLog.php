<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AuditAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property AuditAction $action
 * @property array<string, mixed>|null $metadata
 */
final class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['actor_id', 'action', 'subject_type', 'subject_id', 'metadata', 'ip_address'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'action' => AuditAction::class,
            'metadata' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id')->withTrashed();
    }

    /** @return MorphTo<Model, $this> */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
}
