<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\AccountDeleted;

/**
 * GDPR torleskor a haladas (melyik leckét mikor teljesitette) is szemelyes
 * adat: toroljuk. A soft-delete miatt az adatbazis cascade nem futna le.
 */
final class PurgeLearningProgressOnAccountDeletion
{
    public function handle(AccountDeleted $event): void
    {
        $event->user->lessonCompletions()->delete();
    }
}
