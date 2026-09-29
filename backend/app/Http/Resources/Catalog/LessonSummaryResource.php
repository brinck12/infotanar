<?php

declare(strict_types=1);

namespace App\Http\Resources\Catalog;

use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Katalogus-nezet: a lecke tartalma nelkul, de az ingyenes/fizetos
 * jelolessel, hogy a kliens mar a listaban jelezhesse a paywallt.
 *
 * @mixin Lesson
 */
final class LessonSummaryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'is_free' => $this->is_free,
            'exercises' => ExerciseSummaryResource::collection($this->whenLoaded('exercises')),
        ];
    }
}
