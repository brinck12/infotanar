<?php

declare(strict_types=1);

namespace App\Actions\Auth\Social;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Auth\SocialEmailNotVerified;
use App\Models\SocialAccount;
use App\Models\User;
use App\Notifications\SocialAccountLinkedNotification;
use App\Services\Auth\Social\SocialProfile;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * Melyik fiokba lep a szolgaltato altal igazolt profil? NULL = nincs fiok, hozzajarulas utan nyilhat.
 *
 * Szabalyok (a biztonsagi mag):
 *  - mar osszekotott azonosito: belepes;
 *  - kulonben csak igazolt e-mail-cim szamit, egyebkent elutasitas;
 *  - ugyanazzal a cimmel mar letezo fiok automatikusan osszekotodik, ha a cime megerositett;
 *  - ha a letezo fiok cime NEM megerositett, a fiokot valaki mas is nyithatta (a cimen nem o ult):
 *    az osszekotes elott a jelszava es a tokenjei megszunnek, igy az elozetes regisztralo kizarodik.
 */
final readonly class ResolveSocialLogin
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @throws SocialEmailNotVerified */
    public function handle(SocialProfile $profile): ?User
    {
        $linked = $this->linkedUser($profile);

        if ($linked !== null) {
            return $linked;
        }

        if (! $profile->emailVerified) {
            $this->audit->handle(AuditAction::AuthSocialLoginFailed, null, null, ['provider' => $profile->provider]);

            throw new SocialEmailNotVerified;
        }

        $existing = User::query()->where('email', $profile->email)->first();

        if ($existing === null) {
            return null;
        }

        try {
            return $this->link($existing, $profile);
        } catch (UniqueConstraintViolationException) {
            // Versenyhelyzet: a masik kerés mar osszekototte; ujra a megszokott uton.
            return $this->linkedUser($profile);
        }
    }

    private function linkedUser(SocialProfile $profile): ?User
    {
        $account = SocialAccount::query()
            ->where('provider', $profile->provider)
            ->where('provider_user_id', $profile->providerUserId)
            ->first();

        return $account?->user;
    }

    private function link(User $user, SocialProfile $profile): User
    {
        DB::transaction(function () use ($user, $profile): void {
            $locked = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $unverified = $locked->email_verified_at === null;

            if ($unverified) {
                // Az e-mail-cimet a Google igazolta: innentol a fiok az azonosito tulajdonosae.
                $locked->forceFill(['password' => null, 'email_verified_at' => now()])->save();
                $locked->tokens()->delete();
            }

            $locked->socialAccounts()->create([
                'provider' => $profile->provider,
                'provider_user_id' => $profile->providerUserId,
            ]);

            $this->audit->handle(AuditAction::AuthSocialLinked, $locked, $locked, [
                'provider' => $profile->provider,
                'credentials_reset' => $unverified,
            ]);
        });

        $user->refresh()->notify(new SocialAccountLinkedNotification);

        return $user;
    }
}
