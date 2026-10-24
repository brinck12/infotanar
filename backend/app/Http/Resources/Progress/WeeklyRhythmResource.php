<?php

declare(strict_types=1);

namespace App\Http\Resources\Progress;

use App\Services\Progress\WeeklyRhythm;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property WeeklyRhythm $resource */
final class WeeklyRhythmResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'week_start' => $this->resource->weekStart->format('Y-m-d'),
            'today' => $this->resource->today,
            'days' => $this->resource->days,
            'goal_days' => $this->resource->goalDays,
            'goal_reached' => $this->resource->goalReached,
        ];
    }
}
