<?php

declare(strict_types=1);

namespace App\Actions\Registration;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\InviteCode;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

/**
 * Egy meghivokod felhasznalasa. A hasznalhatosag es a novelés EGY feltetel
 * nelkuli UPDATE-ben tortenik, igy SQLite-on es MySQL-en is atomikus: ket
 * parhuzamos regisztracio egy max_uses=1 kodra nem mehet at egyszerre.
 * A hivonak tranzakcioban kell futnia, hogy a sikertelen regisztracio
 * visszaadja a felhasznalast.
 */
final readonly class ConsumeInviteCode
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @throws ValidationException ha a kod nem letezik, lejart, letiltott vagy elfogyott */
    public function handle(string $code, User $user): InviteCode
    {
        $normalized = InviteCode::normalize($code);

        $affected = InviteCode::query()
            ->where('code', $normalized)
            ->whereNull('disabled_at')
            ->where(static fn (Builder $q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->where(static fn (Builder $q) => $q->whereNull('max_uses')->orWhereColumn('uses', '<', 'max_uses'))
            ->increment('uses');

        if ($affected === 0) {
            throw ValidationException::withMessages(['invite_code' => __('auth.invite.invalid')]);
        }

        $invite = InviteCode::query()->where('code', $normalized)->firstOrFail();

        $this->audit->handle(AuditAction::InviteCodeUsed, $user, $invite, ['user_id' => $user->id]);

        return $invite;
    }
}
