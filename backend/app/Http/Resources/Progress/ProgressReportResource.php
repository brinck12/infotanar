<?php

declare(strict_types=1);

namespace App\Http\Resources\Progress;

use App\Enums\LessonProgressStatus;
use App\Services\Progress\ProgressReport;
use App\Services\Progress\ProgressSummary;
use App\Services\Progress\TrackProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property ProgressReport $resource */
final class ProgressReportResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'overall' => self::summary($this->resource->overall),
            'tracks' => array_map(static fn (TrackProgress $track): array => [
                'id' => $track->track->id,
                'slug' => $track->track->slug,
                'title' => $track->track->title,
                ...self::summary($track->summary),
                'lessons' => array_map(
                    static fn (int $id, LessonProgressStatus $status): array => ['id' => $id, 'status' => $status->value],
                    array_keys($track->lessons),
                    array_values($track->lessons),
                ),
            ], $this->resource->tracks),
        ];
    }

    /** @return array{completed: int, total: int, percent: int} */
    private static function summary(ProgressSummary $summary): array
    {
        return [
            'completed' => $summary->completed,
            'total' => $summary->total,
            'percent' => $summary->percent(),
        ];
    }
}
