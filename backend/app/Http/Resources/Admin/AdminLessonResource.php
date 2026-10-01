<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Lesson */
final class AdminLessonResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'module_id' => $this->module_id,
            'slug' => $this->slug,
            'title' => $this->title,
            'content' => $this->content,
            'video_path' => $this->video_path,
            'captions_path' => $this->captions_path,
            'position' => $this->position,
            'is_free' => $this->is_free,
            'is_published' => $this->is_published,
            'exercise_count' => $this->whenCounted('exercises'),
            'exercises' => AdminExerciseResource::collection($this->whenLoaded('exercises')),
        ];
    }
}
