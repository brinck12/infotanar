<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Auth\InvalidPasswordResetToken;
use App\Models\User;
use App\Notifications\PasswordChangedNotification;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

final readonly class ResetPassword
{
    public function __construct(private RecordAuditEvent $audit) {}

    /**
     * Sikeres csere utan a felhasznalo minden API tokenjet visszavonjuk,
     * hogy egy ellopott munkamenet se eljen tovabb.
     *
     * @throws InvalidPasswordResetToken
     */
    public function handle(string $email, string $token, string $password): void
    {
        $status = Password::broker()->reset(
            ['email' => $email, 'token' => $token, 'password' => $password],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();

                $this->audit->handle(AuditAction::AuthPasswordReset, $user, $user);
                $user->notify(new PasswordChangedNotification);

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw new InvalidPasswordResetToken;
        }
    }
}
