<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Services\Execution\SubmissionOutcome;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property SubmissionOutcome $resource */
final class SubmissionResource extends JsonResource
{
    /** @var string|null */
    public static $wrap = null;

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $submission = $this->resource->submission;

        return [
            'submission_id' => $submission->id,
            'status' => $submission->status,
            'verdict' => $submission->verdict?->value,
            'verdict_label' => $submission->verdict?->label(),
            'violations' => $this->when($this->resource->violations !== [], $this->resource->violations),
            'message' => $this->when($this->resource->violations !== [], implode(' ', $this->resource->violations)),
            'results' => $submission->results ?? [],
            'lesson_completed' => $this->resource->lessonCompleted,
        ];
    }
}
