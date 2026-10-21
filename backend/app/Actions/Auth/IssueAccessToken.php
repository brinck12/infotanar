<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Auth\InvalidCredentials;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\NewAccessToken;

final readonly class IssueAccessToken
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @throws InvalidCredentials */
    public function handle(string $email, string $password, string $deviceName): NewAccessToken
    {
        $user = User::query()->where('email', $email)->first();

        // Jelszo nelkuli (kozossegi belepessel nyitott) fiokkal jelszavas belepes nem lehetseges.
        if ($user === null || ! $user->hasPassword() || ! Hash::check($password, (string) $user->password)) {
            // A naplora nem kerul e-mail-cim: csak az, hogy letezo fiok ellen tortent-e a proba.
            $this->audit->handle(AuditAction::AuthLoginFailed, null, $user);

            throw new InvalidCredentials;
        }

        $token = $user->createToken($deviceName);
        $token->accessToken->setRelation('tokenable', $user);

        $this->audit->handle(AuditAction::AuthLoginSucceeded, $user, $user);

        return $token;
    }
}
