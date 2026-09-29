<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\LessonCompletion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A lesson_id-t a hivo adja meg (->for($lesson)), mert a katalogushoz
 * (track/modul) jelenleg nincs factory.
 *
 * @extends Factory<LessonCompletion>
 */
final class LessonCompletionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'completed_at' => now()->subDays(fake()->numberBetween(0, 30)),
        ];
    }
}
