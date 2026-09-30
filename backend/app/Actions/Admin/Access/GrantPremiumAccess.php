<?php

declare(strict_types=1);

namespace App\Actions\Admin\Access;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Access\AccessGrantAlreadyActive;
use App\Models\AccessGrant;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

final readonly class GrantPremiumAccess
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @throws AccessGrantAlreadyActive */
    public function handle(User $user, User $admin, string $reason, ?CarbonInterface $endsAt): AccessGrant
    {
        return DB::transaction(function () use ($user, $admin, $reason, $endsAt): AccessGrant {
            // Soronkenti zar: ket parhuzamos kerelem ne hozzon letre ket aktiv engedelyt.
            User::query()->whereKey($user->id)->lockForUpdate()->first();

            if (AccessGrant::query()->where('user_id', $user->id)->active()->exists()) {
                throw new AccessGrantAlreadyActive;
            }

            $grant = AccessGrant::create([
                'user_id' => $user->id,
                'granted_by' => $admin->id,
                'reason' => $reason,
                'ends_at' => $endsAt,
            ]);

            $this->audit->handle(AuditAction::AccessGranted, $admin, $user, [
                'grant_id' => $grant->id,
                'reason' => $reason,
                'ends_at' => $endsAt?->toIso8601String(),
            ]);

            return $grant;
        });
    }
}
