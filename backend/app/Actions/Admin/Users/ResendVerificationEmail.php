<?php

declare(strict_types=1);

namespace App\Actions\Admin\Users;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Admin\UserActionRefused;
use App\Models\User;

/** Megerosito level ujrakuldese a felhasznalonak (ugyfelszolgalati eset). */
final readonly class ResendVerificationEmail
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @throws UserActionRefused */
    public function handle(User $user, User $actor): void
    {
        if ($user->hasVerifiedEmail()) {
            throw UserActionRefused::alreadyVerified();
        }

        $user->sendEmailVerificationNotification();

        $this->audit->handle(AuditAction::UserVerificationResent, $actor, $user);
    }
}
