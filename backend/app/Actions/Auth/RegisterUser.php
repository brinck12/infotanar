<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Consent\RecordConsent;
use App\Actions\Registration\ConsumeInviteCode;
use App\Enums\ConsentType;
use App\Models\User;
use App\Notifications\AccountAlreadyExistsNotification;
use App\Services\Registration\RegistrationGate;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class RegisterUser
{
    public function __construct(
        private RecordConsent $recordConsent,
        private RegistrationGate $gate,
        private ConsumeInviteCode $consumeInviteCode,
    ) {}

    /**
     * A fiok es az elfogadott dokumentumok rogzitese egyutt tortenik (#133):
     * nem johet letre fiok ugy, hogy nincs nyoma, mit fogadott el a felhasznalo.
     * Meghivos modban a kod felhasznalasa is ugyanebben a tranzakcioban tortenik.
     * Nem ad vissza semmit: a hivo nem kulonboztetheti meg az uj es a mar letezo fiokot (B13).
     *
     * @throws ValidationException ha meghivos modban a kod hianyzik vagy mar nem hasznalhato
     */
    public function handle(string $name, string $email, string $password, string $termsVersion, string $privacyVersion, ?string $inviteCode = null): void
    {
        // Foglalt cimnel a valasz ugyanaz, mint siker eseten: a tulajdonos
        // tajekoztato levelet kap, a kero semmit nem tud meg a fiok letezeserol.
        $existing = User::withTrashed()->where('email', $email)->first();

        if ($existing !== null) {
            if (! $existing->trashed()) {
                $existing->notify(new AccountAlreadyExistsNotification);
            }

            return;
        }

        $user = DB::transaction(function () use ($name, $email, $password, $termsVersion, $privacyVersion, $inviteCode): User {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => $password,
            ])->refresh();

            if ($this->gate->requiresInvite()) {
                if ($inviteCode === null || $inviteCode === '') {
                    throw ValidationException::withMessages(['invite_code' => __('auth.invite.required')]);
                }

                $this->consumeInviteCode->handle($inviteCode, $user);
            }

            $this->recordConsent->handle($user, ConsentType::Terms, $termsVersion);
            $this->recordConsent->handle($user, ConsentType::Privacy, $privacyVersion);

            return $user;
        });

        // MustVerifyEmail eseten a keretrendszer erre az esemenyre kuldi ki a megerosito levelet.
        event(new Registered($user));
    }
}
