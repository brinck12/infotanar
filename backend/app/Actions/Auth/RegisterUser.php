<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Consent\RecordConsent;
use App\Enums\ConsentType;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;

final readonly class RegisterUser
{
    public function __construct(private RecordConsent $recordConsent) {}

    /**
     * A fiok es az elfogadott dokumentumok rogzitese egyutt tortenik (#133):
     * nem johet letre fiok ugy, hogy nincs nyoma, mit fogadott el a felhasznalo.
     */
    public function handle(string $name, string $email, string $password, string $termsVersion, string $privacyVersion): User
    {
        $user = DB::transaction(function () use ($name, $email, $password, $termsVersion, $privacyVersion): User {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => $password,
            ])->refresh();

            $this->recordConsent->handle($user, ConsentType::Terms, $termsVersion);
            $this->recordConsent->handle($user, ConsentType::Privacy, $privacyVersion);

            return $user;
        });

        // MustVerifyEmail eseten a keretrendszer erre az esemenyre kuldi ki a megerosito levelet.
        event(new Registered($user));

        return $user;
    }
}
