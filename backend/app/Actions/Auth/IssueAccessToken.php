<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Exceptions\Auth\InvalidCredentials;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\NewAccessToken;

final class IssueAccessToken
{
    /** @throws InvalidCredentials */
    public function handle(string $email, string $password, string $deviceName): NewAccessToken
    {
        $user = User::query()->where('email', $email)->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            throw new InvalidCredentials;
        }

        $token = $user->createToken($deviceName);
        $token->accessToken->setRelation('tokenable', $user);

        return $token;
    }
}
