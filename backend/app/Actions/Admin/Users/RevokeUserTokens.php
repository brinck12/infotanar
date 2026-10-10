<?php

declare(strict_types=1);

namespace App\Actions\Admin\Users;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Minden munkamenet (API token) visszavonasa, pl. feltort fiok eseten. */
final readonly class RevokeUserTokens
{
    public function __construct(private RecordAuditEvent $audit) {}

    public function handle(User $user, User $actor): void
    {
        DB::transaction(function () use ($user, $actor): void {
            $revoked = $user->tokens()->delete();

            $this->audit->handle(AuditAction::UserTokensRevoked, $actor, $user, ['revoked_tokens' => $revoked]);
        });
    }
}
