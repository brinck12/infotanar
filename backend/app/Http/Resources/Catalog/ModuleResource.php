<?php

declare(strict_types=1);

namespace App\Http\Resources\Catalog;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Module */
final class ModuleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'lessons' => LessonSummaryResource::collection($this->whenLoaded('lessons')),
        ];
    }
}
