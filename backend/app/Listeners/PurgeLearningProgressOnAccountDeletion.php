<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\AccountDeleted;

/**
 * GDPR torleskor a haladas (melyik leckét mikor teljesitette), valamint a
 * megnyitott tippek es megoldasok is szemelyes adatok: toroljuk. A soft-delete
 * miatt az adatbazis cascade nem futna le.
 */
final class PurgeLearningProgressOnAccountDeletion
{
    public function handle(AccountDeleted $event): void
    {
        $event->user->lessonCompletions()->delete();
        $event->user->hintReveals()->delete();
        $event->user->solutionReveals()->delete();
    }
}
