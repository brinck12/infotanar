<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

final class UserPolicy
{
    /**
     * Admin mas felhasznalo neveben exportalhat/torolhet (GDPR kerelem).
     * Admin fiokot igy nem lehet torolni: az egy kulon, ketkulcsos folyamat.
     */
    public function manageAccount(User $actor, User $target): bool
    {
        return $actor->isAdmin() && ! $target->isAdmin();
    }
}
