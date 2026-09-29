<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Exceptions\Auth\InvalidVerificationLink;
use App\Models\User;
use Illuminate\Auth\Events\Verified;

/** Az alairast a `signed:relative` middleware mar ellenorizte; itt a hash-t vetjuk ossze. */
final class VerifyEmailAddress
{
    /** @throws InvalidVerificationLink */
    public function handle(int $userId, string $hash): User
    {
        $user = User::query()->find($userId);

        if ($user === null || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            throw new InvalidVerificationLink;
        }

        if (! $user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return $user;
    }
}
