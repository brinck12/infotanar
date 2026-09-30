<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\AccountDeleted;

/**
 * A kezi hozzaferes indoklasa (pl. "osztondij, X iskola") szemelyes adat:
 * GDPR torleskor torolni kell. A kiadas/visszavonas tenye az audit naploban marad.
 */
final class PurgeAccessGrantsOnAccountDeletion
{
    public function handle(AccountDeleted $event): void
    {
        $event->user->accessGrants()->delete();
    }
}
