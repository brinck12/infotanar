<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Module */
final class AdminModuleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'track_id' => $this->track_id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'position' => $this->position,
            'lesson_count' => $this->whenCounted('lessons'),
            'lessons' => AdminLessonResource::collection($this->whenLoaded('lessons')),
        ];
    }
}
