<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Subscription>
 */
final class SubscriptionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $start = now()->subDays(fake()->numberBetween(0, 20));

        return [
            'user_id' => User::factory(),
            'provider' => 'test',
            'provider_customer_id' => 'cus_'.Str::random(14),
            'provider_subscription_id' => 'sub_'.Str::random(14),
            'status' => SubscriptionStatus::Active,
            'current_period_start' => $start,
            'current_period_end' => $start->copy()->addMonth(),
            'cancel_at_period_end' => false,
            'canceled_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (): array => ['status' => SubscriptionStatus::Active]);
    }

    public function pastDue(): static
    {
        return $this->state(fn (): array => [
            'status' => SubscriptionStatus::PastDue,
            'current_period_end' => now()->subDay(),
            'grace_ends_at' => now()->addDays(6),
        ]);
    }

    public function graceExpired(): static
    {
        return $this->state(fn (): array => [
            'status' => SubscriptionStatus::PastDue,
            'current_period_end' => now()->subDays(8),
            'grace_ends_at' => now()->subDay(),
        ]);
    }

    public function canceled(): static
    {
        return $this->state(fn (): array => [
            'status' => SubscriptionStatus::Canceled,
            'canceled_at' => now(),
        ]);
    }
}
