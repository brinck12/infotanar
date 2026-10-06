<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Models\User;

final class UpdateProfile
{
    public function handle(User $user, string $name): User
    {
        $user->update(['name' => $name]);

        return $user;
    }
}
