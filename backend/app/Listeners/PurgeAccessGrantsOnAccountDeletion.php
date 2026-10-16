<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\AccountDeleted;
use App\Listeners\Concerns\GuardsAccountDeletion;

/**
 * A kezi hozzaferes indoklasa (pl. "osztondij, X iskola") szemelyes adat:
 * GDPR torleskor torolni kell. A kiadas/visszavonas tenye az audit naploban marad.
 */
final class PurgeAccessGrantsOnAccountDeletion
{
    use GuardsAccountDeletion;

    public function handle(AccountDeleted $event): void
    {
        $this->guarded($event, static function () use ($event): void {
            $event->user->accessGrants()->delete();
        });
    }
}
