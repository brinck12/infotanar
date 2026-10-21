<?php

declare(strict_types=1);

namespace App\Actions\Auth\Social;

use App\Enums\AuditAction;
use App\Exceptions\Auth\SocialEmailNotVerified;
use App\Exceptions\Auth\SocialLoginFailed;
use App\Services\Auth\Social\OAuthHandshake;
use App\Services\Auth\Social\SocialProfile;
use Laravel\Sanctum\NewAccessToken;

/**
 * A callback utan kapott kod beváltása. Meglevo/osszekotheto fiokhoz azonnal token jar;
 * uj felhasznalonal a profilt adjuk vissza, a fiok a hozzajarulas utan (CompleteSocialSignup) nyilik.
 */
final readonly class ExchangeSocialCode
{
    public function __construct(
        private OAuthHandshake $handshake,
        private ResolveSocialLogin $resolve,
        private IssueSocialToken $issueToken,
    ) {}

    /**
     * @return NewAccessToken|SocialProfile token, vagy a hozzajarulasra varo profil
     *
     * @throws SocialLoginFailed
     * @throws SocialEmailNotVerified
     */
    public function handle(string $code, string $verifier, string $deviceName): NewAccessToken|SocialProfile
    {
        $profile = $this->handshake->profileFor($code, $verifier);
        $user = $this->resolve->handle($profile);

        if ($user === null) {
            return $profile;
        }

        $this->handshake->forget($code);

        return $this->issueToken->handle($user, $deviceName, AuditAction::AuthSocialLoginSucceeded);
    }
}
