<?php

declare(strict_types=1);

namespace App\Services\Auth\Social;

use App\Exceptions\Auth\SocialLoginFailed;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Laravel\Socialite\AbstractUser;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

/**
 * A Google-hivasok egyetlen helye. A `state`-et mi kezeljuk (OAuthHandshake), ezert a
 * Socialite allapotmentes modban fut: nincs munkamenet, amit az API-nk ugysem hasznal.
 */
final readonly class GoogleClient
{
    public const PROVIDER = 'google';

    public function isEnabled(): bool
    {
        return Config::boolean('services.google.enabled')
            && Config::string('services.google.client_id', '') !== ''
            && Config::string('services.google.client_secret', '') !== '';
    }

    public function authUrl(string $state): string
    {
        return $this->provider()
            ->with(['state' => $state, 'prompt' => 'select_account'])
            ->redirect()
            ->getTargetUrl();
    }

    /** @throws SocialLoginFailed ha a Google elutasitotta vagy nem ert el a kod */
    public function profile(): SocialProfile
    {
        try {
            $user = $this->provider()->user();
        } catch (Throwable) {
            throw new SocialLoginFailed;
        }

        $id = $user->getId();
        $email = $user->getEmail();
        $raw = $user instanceof AbstractUser ? $user->user : [];
        $verified = $raw['email_verified'] ?? false;

        if ($id === '' || ! is_string($email) || $email === '') {
            throw new SocialLoginFailed;
        }

        $name = $user->getName();

        return new SocialProfile(
            provider: self::PROVIDER,
            providerUserId: (string) $id,
            email: Str::lower($email),
            emailVerified: $verified === true || $verified === 'true',
            name: is_string($name) && trim($name) !== '' ? Str::limit(trim($name), 255, '') : Str::before($email, '@'),
        );
    }

    private function provider(): GoogleProvider
    {
        $provider = Socialite::buildProvider(GoogleProvider::class, [
            'client_id' => Config::string('services.google.client_id'),
            'client_secret' => Config::string('services.google.client_secret'),
            'redirect' => Config::string('services.google.redirect'),
        ]);

        /** @var GoogleProvider $stateless */
        $stateless = $provider->stateless();

        return $stateless;
    }
}
