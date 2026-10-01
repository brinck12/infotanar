<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Auth\InvalidVerificationLink;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * E-mail-cim csere masodik lepese (#135): az uj cimre kuldott link megnyitasa.
 * Az alairast a `signed:relative` middleware mar ellenorizte; itt azt nezzuk,
 * hogy a link ahhoz a cimhez tartozik-e, amelyik eppen megerositesre var.
 * Az uj cim ettol kezdve megerositettnek szamit (a link oda erkezett).
 */
final readonly class ConfirmEmailChange
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @throws InvalidVerificationLink */
    public function handle(int $userId, string $hash): User
    {
        $user = User::query()->find($userId);

        if ($user === null || $user->pending_email === null || ! hash_equals(sha1($user->pending_email), $hash)) {
            throw new InvalidVerificationLink;
        }

        try {
            DB::transaction(function () use ($user): void {
                $user->forceFill([
                    'email' => $user->pending_email,
                    'pending_email' => null,
                    'email_verified_at' => now(),
                ])->save();

                // A cimeket szandekosan nem naplozzuk: szemelyes adat, a naplo tovabb el, mint a fiok.
                $this->audit->handle(AuditAction::AccountEmailChanged, $user, $user);
            });
        } catch (UniqueConstraintViolationException) {
            // A kerelem es a megerosites kozott valaki mas regisztralt ezzel a cimmel.
            throw new InvalidVerificationLink;
        }

        return $user;
    }
}
