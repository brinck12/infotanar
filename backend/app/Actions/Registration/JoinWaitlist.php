<?php

declare(strict_types=1);

namespace App\Actions\Registration;

use App\Models\WaitlistEntry;
use Illuminate\Database\UniqueConstraintViolationException;

/**
 * Varolista-feliratkozas. Idempotens es semleges: a hivo ugyanazt kapja,
 * akar mar fel van iratkozva, akar mar regisztralt fiok a cim, igy a vegpont
 * nem hasznalhato e-mail-cim felderitesre.
 */
final readonly class JoinWaitlist
{
    public function handle(string $email, ?string $note): void
    {
        try {
            WaitlistEntry::query()->firstOrCreate(['email' => $email], ['note' => $note]);
        } catch (UniqueConstraintViolationException) {
            // Parhuzamos feliratkozas ugyanarra a cimre: mar rogzitve van, nincs teendo.
        }
    }
}
