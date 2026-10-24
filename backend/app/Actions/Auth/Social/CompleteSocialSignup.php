<?php

declare(strict_types=1);

namespace App\Actions\Auth\Social;

use App\Actions\Audit\RecordAuditEvent;
use App\Actions\Consent\RecordConsent;
use App\Actions\Registration\ConsumeInviteCode;
use App\Enums\AuditAction;
use App\Enums\ConsentType;
use App\Exceptions\Auth\SocialEmailNotVerified;
use App\Exceptions\Auth\SocialLoginFailed;
use App\Models\User;
use App\Services\Auth\Social\OAuthHandshake;
use App\Services\Registration\RegistrationGate;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\NewAccessToken;

/**
 * Uj fiok nyitasa kozossegi belepessel. Ugyanaz a kapu, mint a jelszavas regisztracional:
 * az elfogadott dokumentumok rogzitese (#133) es zart betaban a meghivokod felhasznalasa
 * egyutt, egy tranzakcioban a fiokkal.
 */
final readonly class CompleteSocialSignup
{
    public function __construct(
        private OAuthHandshake $handshake,
        private RegistrationGate $gate,
        private RecordConsent $recordConsent,
        private ConsumeInviteCode $consumeInviteCode,
        private ResolveSocialLogin $resolve,
        private IssueSocialToken $issueToken,
        private RecordAuditEvent $audit,
    ) {}

    /**
     * @throws SocialLoginFailed
     * @throws SocialEmailNotVerified
     * @throws ValidationException ha zart modban a meghivokod hianyzik vagy nem hasznalhato
     */
    public function handle(string $code, string $verifier, string $termsVersion, string $privacyVersion, ?string $inviteCode, string $deviceName): NewAccessToken
    {
        $profile = $this->handshake->profileFor($code, $verifier);

        if (! $profile->emailVerified) {
            throw new SocialEmailNotVerified;
        }

        try {
            $user = DB::transaction(function () use ($profile, $termsVersion, $privacyVersion, $inviteCode): User {
                $user = User::create([
                    'name' => $profile->name,
                    'email' => $profile->email,
                    'password' => null,
                ])->refresh();
                // A cimet a Google igazolta; a fillable-ben nincs, ezert forceFill.
                $user->forceFill(['email_verified_at' => now()])->save();

                if ($this->gate->requiresInvite()) {
                    if ($inviteCode === null || $inviteCode === '') {
                        throw ValidationException::withMessages(['invite_code' => __('auth.invite.required')]);
                    }

                    $this->consumeInviteCode->handle($inviteCode, $user);
                }

                $this->recordConsent->handle($user, ConsentType::Terms, $termsVersion);
                $this->recordConsent->handle($user, ConsentType::Privacy, $privacyVersion);

                $user->socialAccounts()->create([
                    'provider' => $profile->provider,
                    'provider_user_id' => $profile->providerUserId,
                ]);

                $this->audit->handle(AuditAction::AuthSocialRegistered, $user, $user, ['provider' => $profile->provider]);

                return $user;
            });
        } catch (UniqueConstraintViolationException) {
            // Kozben megnyilt a fiok (masik kerés vagy jelszavas regisztracio): a megszokott feloldas dont.
            $user = $this->resolve->handle($profile);

            if ($user === null) {
                throw new SocialLoginFailed;
            }

            $this->handshake->forget($code);

            return $this->issueToken->handle($user, $deviceName, AuditAction::AuthSocialLoginSucceeded);
        }

        $this->handshake->forget($code);

        return $this->issueToken->handle($user, $deviceName, AuditAction::AuthSocialLoginSucceeded);
    }
}
