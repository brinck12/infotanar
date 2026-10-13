<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\AccountDeleted;

/**
 * GDPR torleskor a szobeli gyakorlas (jegyzetek, onertekeles) szemelyes adat:
 * toroljuk. A soft-delete miatt az adatbazis cascade nem futna le.
 */
final class PurgeOralPracticeOnAccountDeletion
{
    public function handle(AccountDeleted $event): void
    {
        $event->user->oralPractices()->delete();
    }
}
