<?php

declare(strict_types=1);

namespace App\Http\Resources\Catalog;

use App\Models\Exercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Exercise */
final class ExerciseSummaryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'level' => $this->level,
            'difficulty' => $this->difficulty,
            'allowed_languages' => $this->allowed_languages,
        ];
    }
}
