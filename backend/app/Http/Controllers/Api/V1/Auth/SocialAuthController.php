<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\Social\CompleteSocialSignup;
use App\Actions\Auth\Social\ExchangeSocialCode;
use App\Exceptions\Auth\SocialLoginFailed;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\GoogleCompleteRequest;
use App\Http\Requests\Auth\GoogleExchangeRequest;
use App\Http\Requests\Auth\GoogleRedirectRequest;
use App\Http\Resources\AccessTokenResource;
use App\Services\Auth\Social\GoogleClient;
use App\Services\Auth\Social\OAuthHandshake;
use App\Services\Auth\Social\SocialProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\NewAccessToken;

final class SocialAuthController extends Controller
{
    /** Mely szolgaltatokkal lehet belepni (a kliens ebbol dont, kirajzolja-e a gombot). */
    public function providers(GoogleClient $google): JsonResponse
    {
        return response()->json(['data' => ['google' => $google->isEnabled()]]);
    }

    public function redirect(GoogleRedirectRequest $request, GoogleClient $google, OAuthHandshake $handshake): JsonResponse
    {
        $state = $handshake->begin($request->challenge());

        return response()->json(['data' => ['url' => $google->authUrl($state)]]);
    }

    /**
     * A Google ide tereli vissza a bongeszot, ezert hibanal sem JSON-t adunk, hanem a frontend
     * belepo oldalara iranyitunk (hibakoddal), ahol a felhasznalo ertheto uzenetet lat.
     */
    public function callback(Request $request, GoogleClient $google, OAuthHandshake $handshake): RedirectResponse
    {
        $landing = Config::string('app.frontend_url').'/belepes/google';
        $state = $request->query('state');

        if ($request->query('error') !== null) {
            return redirect()->away($landing.'?error=cancelled');
        }

        try {
            if (! is_string($state)) {
                throw new SocialLoginFailed;
            }

            $challenge = $handshake->consumeState($state);
            $code = $handshake->storeCode($google->profile(), $challenge);
        } catch (SocialLoginFailed) {
            return redirect()->away($landing.'?error=failed');
        }

        return redirect()->away($landing.'?'.http_build_query(['code' => $code]));
    }

    public function exchange(GoogleExchangeRequest $request, ExchangeSocialCode $exchange): JsonResponse
    {
        $result = $exchange->handle($request->code(), $request->verifier(), $request->deviceName());

        if ($result instanceof SocialProfile) {
            return response()->json(['data' => [
                'status' => 'consent_required',
                'name' => $result->name,
                'email' => $result->email,
            ]]);
        }

        return $this->signedIn($request, $result);
    }

    public function complete(GoogleCompleteRequest $request, CompleteSocialSignup $complete): JsonResponse
    {
        return $this->signedIn($request, $complete->handle(
            code: $request->code(),
            verifier: $request->verifier(),
            termsVersion: $request->string('terms_version')->toString(),
            privacyVersion: $request->string('privacy_version')->toString(),
            inviteCode: $request->inviteCode(),
            deviceName: $request->deviceName(),
        ));
    }

    private function signedIn(Request $request, NewAccessToken $token): JsonResponse
    {
        return response()->json(['data' => [
            'status' => 'signed_in',
            ...AccessTokenResource::make($token)->resolve($request),
        ]]);
    }
}
