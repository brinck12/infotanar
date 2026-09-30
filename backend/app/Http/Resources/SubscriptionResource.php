<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A sajat elofizetes nezete (#17). A szolgaltatoi azonositot (kartya-token)
 * nem adja ki.
 *
 * @mixin Subscription
 */
final class SubscriptionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'status' => $this->status->value,
            'grants_access' => $this->grantsAccess(),
            'current_period_start' => $this->current_period_start?->toIso8601String(),
            'current_period_end' => $this->current_period_end?->toIso8601String(),
            'grace_ends_at' => $this->grace_ends_at?->toIso8601String(),
            'cancel_at_period_end' => $this->cancel_at_period_end,
        ];
    }
}
