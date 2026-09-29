<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Registered;

final class RegisterUser
{
    public function handle(string $name, string $email, string $password): User
    {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ])->refresh();

        // MustVerifyEmail eseten a keretrendszer erre az esemenyre kuldi ki a megerosito levelet.
        event(new Registered($user));

        return $user;
    }
}
