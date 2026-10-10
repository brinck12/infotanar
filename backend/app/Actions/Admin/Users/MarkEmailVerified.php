<?php

declare(strict_types=1);

namespace App\Actions\Admin\Users;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Admin\UserActionRefused;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\DB;

/**
 * Az e-mail-cim kezi megerositese, ha a level nem er el a felhasznaloig
 * (pl. a levelezo szuri). Az indoklas kotelezo, es a naploba kerul.
 */
final readonly class MarkEmailVerified
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @throws UserActionRefused */
    public function handle(User $user, User $actor, string $reason): void
    {
        DB::transaction(function () use ($user, $actor, $reason): void {
            if ($user->hasVerifiedEmail()) {
                throw UserActionRefused::alreadyVerified();
            }

            $user->markEmailAsVerified();

            $this->audit->handle(AuditAction::UserEmailVerified, $actor, $user, ['reason' => $reason]);
        });

        event(new Verified($user));
    }
}
