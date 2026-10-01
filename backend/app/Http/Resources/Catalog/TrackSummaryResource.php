<?php

declare(strict_types=1);

namespace App\Http\Resources\Catalog;

use App\Models\Track;
use App\Services\Progress\ProgressSummary;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy kepzesi ag a listaban (`GET /tracks`): mit tartalmaz, es (bejelentkezve)
 * hol tart benne a nezo.
 *
 * @mixin Track
 */
final class TrackSummaryResource extends JsonResource
{
    public function __construct(Track $track, private readonly ?ProgressSummary $progress)
    {
        parent::__construct($track);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'module_count' => $this->whenCounted('modules'),
            'lesson_count' => $this->whenCounted('lessons'),
            'free_lesson_count' => $this->whenCounted('free_lessons'),
            // Vendegnel null: neki nincs haladasa.
            'progress' => $this->progress === null ? null : [
                'completed' => $this->progress->completed,
                'total' => $this->progress->total,
                'percent' => $this->progress->percent(),
            ],
        ];
    }
}
