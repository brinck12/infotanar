<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\AccountDeleted;
use App\Listeners\Concerns\GuardsAccountDeletion;

/**
 * GDPR torleskor a haladas (melyik leckét mikor teljesitette) is szemelyes
 * adat: toroljuk. A soft-delete miatt az adatbazis cascade nem futna le.
 */
final class PurgeLearningProgressOnAccountDeletion
{
    use GuardsAccountDeletion;

    public function handle(AccountDeleted $event): void
    {
        $this->guarded($event, static function () use ($event): void {
            $event->user->lessonCompletions()->delete();
        });
    }
}
