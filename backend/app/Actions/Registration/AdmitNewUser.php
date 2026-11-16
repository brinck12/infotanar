<?php

declare(strict_types=1);

namespace App\Actions\Registration;

use App\Actions\Consent\RecordConsent;
use App\Enums\ConsentType;
use App\Models\User;
use App\Services\Registration\RegistrationGate;
use Illuminate\Validation\ValidationException;

/**
 * Egy frissen letrehozott fiok belepesi feltetelei: zart betaban a meghivokod
 * felhasznalasa, es az elfogadott dokumentumok rogzitese (#133). Minden uj fiok
 * (jelszavas es kozossegi) ugyanezen megy at, a fiokot letrehozo tranzakcioban.
 */
final readonly class AdmitNewUser
{
    public function __construct(
        private RegistrationGate $gate,
        private ConsumeInviteCode $consumeInviteCode,
        private RecordConsent $recordConsent,
    ) {}

    /**
     * @throws ValidationException ha meghivos modban a kod hianyzik vagy nem hasznalhato
     */
    public function handle(User $user, string $termsVersion, string $privacyVersion, ?string $inviteCode): void
    {
        if ($this->gate->requiresInvite()) {
            if ($inviteCode === null || $inviteCode === '') {
                throw ValidationException::withMessages(['invite_code' => __('auth.invite.required')]);
            }

            $this->consumeInviteCode->handle($inviteCode, $user);
        }

        $this->recordConsent->handle($user, ConsentType::Terms, $termsVersion);
        $this->recordConsent->handle($user, ConsentType::Privacy, $privacyVersion);
    }
}
