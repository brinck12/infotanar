<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Events\AccountDeleted;
use App\Models\User;
use Illuminate\Auth\Passwords\PasswordBroker;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * GDPR 17. cikk (torleshez valo jog).
 *
 * A szemelyes adatokat visszafordithatatlanul anonimizaljuk, a fiokot
 * soft-delete-tel lezarjuk. A beadasok a felhasznalotol levalasztva
 * maradnak meg, hogy az anonim feladat-statisztikak ne serüljenek.
 * A naplobejegyzes ugyanabban a tranzakcioban keszul, mint a torles.
 */
final readonly class DeleteAccount
{
    public function __construct(private RecordAuditEvent $audit) {}

    public function handle(User $user, User $actor): void
    {
        DB::transaction(function () use ($user, $actor): void {
            $user->tokens()->delete();

            $broker = Password::broker();
            if ($broker instanceof PasswordBroker) {
                $broker->deleteToken($user);
            }

            $user->submissions()->update(['user_id' => null]);
            // A kiallitott szamlak sajat masolatot tartanak (szamviteli megorzes), a profil torolheto.
            $user->billingProfile()->delete();

            $user->forceFill([
                'name' => 'Törölt felhasználó',
                'email' => sprintf('deleted-%d-%s@deleted.invalid', $user->id, Str::lower(Str::random(8))),
                // Egy felbehagyott cimcsere (#135) is szemelyes adat.
                'pending_email' => null,
                'password' => Str::random(64),
                'email_verified_at' => null,
                'remember_token' => null,
            ])->save();

            $user->delete();

            $this->audit->handle(AuditAction::AccountDeleted, $actor, $user, [
                'on_behalf' => ! $actor->is($user),
            ]);
        });

        AccountDeleted::dispatch($user);
    }
}
