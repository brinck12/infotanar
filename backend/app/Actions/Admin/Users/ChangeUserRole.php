<?php

declare(strict_types=1);

namespace App\Actions\Admin\Users;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Enums\Role;
use App\Exceptions\Admin\UserActionRefused;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Szerepkor-valtas (admin <-> diak) a szerveren futtatott `user:role`
 * parancs helyett. A sajat szerepkor valtoztatasat a UserPolicy tiltja;
 * itt az utolso admin vedelme van, mert ezt csak a teljes allapot ismereteben
 * lehet eldonteni.
 */
final readonly class ChangeUserRole
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @throws UserActionRefused */
    public function handle(User $user, Role $role, User $actor): User
    {
        return DB::transaction(function () use ($user, $role, $actor): User {
            // Zar az adminokon: ket admin egyidoben ne fokozhassa le egymast ugy, hogy senki ne maradjon.
            $adminIds = User::query()->where('role', Role::Admin)->lockForUpdate()->pluck('id');

            // A zar alatt friss szerepkorrel dolgozunk, nem a keres elejen betoltottel.
            $user->refresh();
            $previous = $user->role;

            if ($previous === $role) {
                return $user;
            }

            if ($previous === Role::Admin && $adminIds->reject($user->id)->isEmpty()) {
                throw UserActionRefused::lastAdmin();
            }

            $user->forceFill(['role' => $role])->save();

            $this->audit->handle(AuditAction::UserRoleChanged, $actor, $user, [
                'from' => $previous->value,
                'to' => $role->value,
            ]);

            return $user;
        });
    }
}
