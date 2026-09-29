<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Exercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * v1 lista-nezet ("task"): leiras es tesztesetek nelkul.
 *
 * @mixin Exercise
 */
final class TaskSummaryResource extends JsonResource
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
            'topic' => TopicResource::make($this->whenLoaded('lesson', fn () => $this->lesson?->module)),
        ];
    }
}
