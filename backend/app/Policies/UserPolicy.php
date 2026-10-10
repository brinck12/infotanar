<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

final class UserPolicy
{
    /**
     * Admin mas felhasznalo neveben exportalhat/torolhet (GDPR kerelem).
     * Admin fiokot igy nem lehet torolni: az egy kulon, ketkulcsos folyamat,
     * es ez egyben az utolso admin torlese ellen is vedi a rendszert.
     */
    public function manageAccount(User $actor, User $target): bool
    {
        return $actor->isAdmin() && ! $target->isAdmin();
    }

    /** Szerepkor-valtas (#162). A sajatodat nem: igy nem fokozhatod le magad veletlenul. */
    public function changeRole(User $actor, User $target): bool
    {
        return $this->onAnotherUser($actor, $target);
    }

    /**
     * Megerosites, munkamenetek es jelszo-visszaallitas (#162). Magadon nem:
     * a sajat fiokodat a szokasos felhasznaloi feluleten kezeled.
     */
    public function manageSecurity(User $actor, User $target): bool
    {
        return $this->onAnotherUser($actor, $target);
    }

    /** Mas felhasznalo fizeteseinek es szamlainak megtekintese (#162). */
    public function viewBilling(User $actor, User $target): bool
    {
        return $actor->isAdmin();
    }

    private function onAnotherUser(User $actor, User $target): bool
    {
        return $actor->isAdmin() && ! $actor->is($target);
    }
}
