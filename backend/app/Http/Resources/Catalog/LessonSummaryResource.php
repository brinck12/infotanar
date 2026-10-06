<?php

declare(strict_types=1);

namespace App\Http\Resources\Catalog;

use App\Models\Exercise;
use App\Models\Lesson;
use App\Services\Catalog\LessonViewer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy lecke a tananyag-nezetben: a tartalma nelkul, de azzal, hogy a nezonek
 * elerheto-e es hol tart benne.
 *
 * @mixin Lesson
 */
final class LessonSummaryResource extends JsonResource
{
    public function __construct(private readonly Lesson $lesson, private readonly LessonViewer $viewer)
    {
        parent::__construct($lesson);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $denial = $this->viewer->denial($this->lesson);

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'is_free' => $this->is_free,
            'locked' => $denial !== null,
            'locked_reason' => $denial?->value,
            'has_video' => $this->video_path !== null,
            'exercise_count' => $this->exercises->count(),
            // Vendegnel null: neki nincs haladasa.
            'status' => $this->viewer->status($this->lesson)?->value,
            'exercises' => $this->exercises->map(fn (Exercise $exercise): ExerciseSummaryResource => new ExerciseSummaryResource($exercise, $this->viewer->exerciseStatuses)),
        ];
    }
}
