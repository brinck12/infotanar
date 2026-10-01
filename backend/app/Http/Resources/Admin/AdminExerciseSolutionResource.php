<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ExerciseSolution;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ExerciseSolution */
final class AdminExerciseSolutionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exercise_id' => $this->exercise_id,
            'language' => $this->language,
            'source_code' => $this->source_code,
            'explanation' => $this->explanation,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
