<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Track;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Track */
final class AdminTrackResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'position' => $this->position,
            'is_published' => $this->is_published,
            'module_count' => $this->whenCounted('modules'),
            'modules' => AdminModuleResource::collection($this->whenLoaded('modules')),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
