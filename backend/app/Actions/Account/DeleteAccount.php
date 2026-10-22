<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Events\AccountDeleted;
use App\Models\AuditLog;
use App\Models\Consent;
use App\Models\User;
use Illuminate\Auth\Passwords\PasswordBroker;
use Illuminate\Database\Eloquent\Builder;
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
    /** A torolt beadasok forraskodjanak helyere kerulo jelolo (a `source_code` oszlop nem nullazhato). */
    private const REDACTED_SOURCE = '[törölve]';

    public function __construct(private RecordAuditEvent $audit) {}

    /**
     * Az audit sor marad (a muvelet tenye bizonyitek), de a szemelyes nyomok nem: az IP-cim
     * nullazodik, a szabad szoveges metaadat (pl. hozzaferes indoklasa) jelolore cserelodik.
     * A torles sajat sora megtartja a metaadatat (nincs benne szemelyes adat).
     */
    private function redactAuditTrail(User $user): void
    {
        $own = static fn (Builder $query): Builder => $query
            ->where('actor_id', $user->id)
            ->orWhere(static fn (Builder $subject): Builder => $subject
                ->where('subject_type', $user->getMorphClass())
                ->where('subject_id', $user->id));

        AuditLog::query()->where($own)->update(['ip_address' => null]);

        AuditLog::query()
            ->where($own)
            ->whereNotNull('metadata')
            ->where('action', '!=', AuditAction::AccountDeleted->value)
            ->update(['metadata' => json_encode(['redacted' => true])]);
    }

    public function handle(User $user, User $actor): void
    {
        DB::transaction(function () use ($user, $actor): void {
            $user->tokens()->delete();

            $broker = Password::broker();
            if ($broker instanceof PasswordBroker) {
                $broker->deleteToken($user);
            }

            // A forraskod szabad szoveg (nev, osztaly lehet benne): torlesre kerul, a beadas sora (verdikt) marad.
            $user->submissions()->update(['user_id' => null, 'source_code' => self::REDACTED_SOURCE]);

            // Az elfogadas ténye (tipus, verzio, ido) a bizonyitek; az IP es a bongeszo szemelyes adat.
            Consent::query()->where('user_id', $user->id)->update(['ip_address' => null, 'user_agent' => null]);
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
                // A tanulasi celok szemelyes adatok.
                'preferences' => null,
                // A heti level kapcsoloja es a kuldes nyoma is a felhasznalohoz kotott adat.
                'weekly_summary_opt_in' => false,
                'weekly_summary_sent_at' => null,
            ])->save();

            $user->delete();

            $this->audit->handle(AuditAction::AccountDeleted, $actor, $user, [
                'on_behalf' => ! $actor->is($user),
            ]);

            $this->redactAuditTrail($user);
        });

        AccountDeleted::dispatch($user);
    }
}
