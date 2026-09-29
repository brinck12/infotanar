<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\AccountDeleted;

/**
 * GDPR torleskor a szamlazas is alljon le. Amig nincs szolgaltato-integracio
 * (#12/#14), csak helyben zarjuk le; utana a szolgaltatonal is itt kell lemondani.
 */
final class CancelSubscriptionOnAccountDeletion
{
    public function handle(AccountDeleted $event): void
    {
        $event->user->liveSubscription?->cancel();
    }
}
