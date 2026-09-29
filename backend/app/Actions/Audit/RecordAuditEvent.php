<?php

declare(strict_types=1);

namespace App\Actions\Audit;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

final readonly class RecordAuditEvent
{
    public function __construct(private Request $request) {}

    /** @param array<string, mixed> $metadata */
    public function handle(AuditAction $action, ?User $actor, ?Model $subject = null, array $metadata = []): AuditLog
    {
        return AuditLog::create([
            'actor_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'metadata' => $metadata === [] ? null : $metadata,
            'ip_address' => $this->request->ip(),
        ]);
    }
}
