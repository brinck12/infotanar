<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
final class UserFactory extends Factory
{
    /** Egyszer hash-elt jelszo, hogy a sok felhasznalot gyartó tesztek ne lassuljanak be. */
    private static ?string $password = null;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => self::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (): array => ['email_verified_at' => null]);
    }

    /** A `role` nem mass assignable, ezert letrehozas utan, forceFill-lel allitjuk. */
    public function admin(): static
    {
        return $this->afterMaking(function (User $user): void {
            $user->forceFill(['role' => Role::Admin]);
        });
    }
}
