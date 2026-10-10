<?php

declare(strict_types=1);

namespace App\Actions\Admin\Users;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Admin\UserActionRefused;
use App\Models\User;
use Illuminate\Support\Facades\Password;

/**
 * A szokasos jelszo-visszaallito level kuldese. Admin jelszot nem allit be:
 * az uj jelszot csak a felhasznalo ismeri meg. A kuldes szandekosan nem a
 * `SendPasswordResetLink`-et hasznalja, mert annak az eredmenyet elnyeli
 * (a fiokok felderitese ellen), az adminnak viszont tudnia kell, ha a level
 * a gyakori kuldes miatt nem ment el.
 */
final readonly class SendUserPasswordReset
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @throws UserActionRefused */
    public function handle(User $user, User $actor): void
    {
        if (Password::broker()->sendResetLink(['email' => $user->email]) === Password::RESET_THROTTLED) {
            throw UserActionRefused::passwordResetThrottled();
        }

        $this->audit->handle(AuditAction::UserPasswordResetSent, $actor, $user);
    }
}
