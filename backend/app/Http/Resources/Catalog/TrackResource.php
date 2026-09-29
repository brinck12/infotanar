<?php

declare(strict_types=1);

namespace App\Http\Resources\Catalog;

use App\Models\Track;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Track */
final class TrackResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'lesson_count' => $this->whenCounted('lessons'),
            'free_lesson_count' => $this->whenCounted('freeLessons'),
            'modules' => ModuleResource::collection($this->whenLoaded('modules')),
        ];
    }
}
