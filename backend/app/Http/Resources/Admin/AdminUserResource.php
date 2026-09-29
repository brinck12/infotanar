<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Tamogatasi/megfigyelesi nezet. Fizetesi adat (kartya, szolgaltatoi
 * azonositok) SOHA nem kerul bele: csak az elofizetes allapota es datumai.
 *
 * @mixin User
 */
final class AdminUserResource extends JsonResource
{
    public function __construct(User $user, private readonly int $publishedLessonCount = 0)
    {
        parent::__construct($user);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $completed = (int) ($this->lesson_completions_count ?? 0);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'registered_at' => $this->created_at?->toIso8601String(),
            'has_premium_access' => $this->hasPremiumAccess(),
            'subscription' => $this->whenLoaded('liveSubscription', fn (): ?array => self::subscription($this->liveSubscription)),
            'progress' => [
                'completed' => $completed,
                'total' => $this->publishedLessonCount,
                'percent' => $this->publishedLessonCount === 0 ? 0 : intdiv($completed * 100, $this->publishedLessonCount),
            ],
        ];
    }

    /** @return array<string, mixed>|null */
    private static function subscription(?Subscription $subscription): ?array
    {
        if ($subscription === null) {
            return null;
        }

        return [
            'status' => $subscription->status->value,
            'current_period_start' => $subscription->current_period_start?->toIso8601String(),
            'current_period_end' => $subscription->current_period_end?->toIso8601String(),
            'grace_ends_at' => $subscription->grace_ends_at?->toIso8601String(),
            'cancel_at_period_end' => $subscription->cancel_at_period_end,
        ];
    }
}
