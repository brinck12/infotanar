<?php

declare(strict_types=1);

namespace App\Services\Auth\Social;

use App\Exceptions\Auth\SocialLoginFailed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * A belepes allapota a gyorsitotarban (az API-nak nincs munkamenete). A bongeszohoz
 * kotes PKCE-szeru: a kliens egy veletlen `verifier`-t tart, a hash-et (`challenge`)
 * kuldi el elore; a kodot csak a verifier birtokosa valthatja be. Igy egy tamado
 * nem tudja a sajat Google-fiokjaval beleptetni az aldozat bongeszojet.
 */
final class OAuthHandshake
{
    /** Az allapot es a kod elettartama (masodperc): a hozzajarulas-kepernyo is ezen belul kell, hogy kitoltheto legyen. */
    private const TTL = 600;

    /** A `state` hozzarendeli a kert challenge-et; egyszer hasznalhato. */
    public function begin(string $challenge): string
    {
        $state = Str::random(48);
        Cache::put($this->stateKey($state), $challenge, self::TTL);

        return $state;
    }

    /** @throws SocialLoginFailed ha a state ismeretlen vagy mar felhasznalt */
    public function consumeState(string $state): string
    {
        $challenge = Cache::pull($this->stateKey($state));

        if (! is_string($challenge)) {
            throw new SocialLoginFailed;
        }

        return $challenge;
    }

    public function storeCode(SocialProfile $profile, string $challenge): string
    {
        $code = Str::random(64);
        Cache::put($this->codeKey($code), ['profile' => $profile->toArray(), 'challenge' => $challenge], self::TTL);

        return $code;
    }

    /**
     * A kodot nem hasznalja el: hianyzo hozzajarulasnal ugyanazzal a kodal folytathato.
     * Hibas verifiernel sem torlodik (a tamado ne tudja kifogyasztani az aldozat kodjat).
     *
     * @throws SocialLoginFailed
     */
    public function profileFor(string $code, string $verifier): SocialProfile
    {
        $entry = Cache::get($this->codeKey($code));

        if (! is_array($entry) || ! is_string($entry['challenge'] ?? null) || ! is_array($entry['profile'] ?? null)) {
            throw new SocialLoginFailed;
        }

        if (! hash_equals($entry['challenge'], self::challengeFor($verifier))) {
            throw new SocialLoginFailed;
        }

        return SocialProfile::fromArray($entry['profile']);
    }

    public function forget(string $code): void
    {
        Cache::forget($this->codeKey($code));
    }

    /** Base64url(SHA-256(verifier)), padding nelkul (RFC 7636, S256). */
    public static function challengeFor(string $verifier): string
    {
        return rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
    }

    private function stateKey(string $state): string
    {
        return 'oauth:state:'.hash('sha256', $state);
    }

    private function codeKey(string $code): string
    {
        return 'oauth:code:'.hash('sha256', $code);
    }
}
