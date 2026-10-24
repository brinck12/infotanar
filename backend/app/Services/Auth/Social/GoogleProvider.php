<?php

declare(strict_types=1);

namespace App\Services\Auth\Social;

use GuzzleHttp\RequestOptions;
use Illuminate\Support\Facades\Config;
use Laravel\Socialite\Two\GoogleProvider as BaseGoogleProvider;

/**
 * A Socialite Google-szolgaltatoja konfiguralhato vegpontokkal, hogy a tesztek
 * egy helyi stubot hivhassanak. Eleshen az alapertekek (Google) ervenyesek.
 */
final class GoogleProvider extends BaseGoogleProvider
{
    protected function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase(Config::string('services.google.auth_url'), $state);
    }

    protected function getTokenUrl()
    {
        return Config::string('services.google.token_url');
    }

    /**
     * Mindig a userinfo vegpontot hivjuk (nem a JWT-t bontjuk): egyetlen, egyszeruen
     * stubolhato ut, a Google ugyanazt az `email_verified` mezot adja.
     *
     * @return array<string, mixed>
     */
    protected function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get(Config::string('services.google.userinfo_url'), [
            RequestOptions::HEADERS => [
                'Accept' => 'application/json',
                'Authorization' => 'Bearer '.$token,
            ],
        ]);

        /** @var array<string, mixed> */
        return json_decode((string) $response->getBody(), true, flags: JSON_THROW_ON_ERROR);
    }
}
