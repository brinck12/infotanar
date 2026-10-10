<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Jelszocsere bejelentkezve (#135). A tobbi eszkoz kijelentkezik (ha a regi
 * jelszo kiszivargott, az azzal szerzett munkamenet se eljen tovabb), az a
 * token viszont megmarad, amelyikkel a csere tortent.
 */
final readonly class ChangePassword
{
    public function __construct(private RecordAuditEvent $audit) {}

    public function handle(User $user, string $newPassword): void
    {
        DB::transaction(function () use ($user, $newPassword): void {
            $user->forceFill(['password' => $newPassword])->save();

            $user->tokens()->whereKeyNot($user->currentAccessToken()->getKey())->delete();

            $this->audit->handle(AuditAction::AccountPasswordChanged, $user, $user);
        });
    }
}
