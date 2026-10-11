<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Services\FileTasks\FileSubmissionView;
use App\Services\FileTasks\ResultSnapshot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy fajlbeadas es az ertekelese: pontosan a frontend `FileSubmission`
 * tipusa (frontend/src/features/filetasks/api.ts).
 *
 * A `groups`, `items` es `facts` a tarolt pillanatkepbol jon, igy a regi
 * eredmeny az ertekelolap kesobbi valtozasa utan is ugyanazt mutatja. Kezi
 * pontnal a `state` a jeloles utan is `manual`; a pontja a `manual_mark`-tol
 * fugg, es a pontszamok mar tartalmazzak.
 */
final class FileSubmissionResource extends JsonResource
{
    /** @var FileSubmissionView */
    public $resource;

    public function __construct(FileSubmissionView $resource)
    {
        parent::__construct($resource);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $submission = $this->resource->submission;
        $result = ResultSnapshot::fromArray($submission->result)->toArray();

        return [
            'id' => $submission->id,
            'exercise_id' => $submission->exercise_id,
            'exercise_title' => $submission->exercise->title,
            'attempt' => $submission->attempt,
            'status' => $submission->status->apiValue(),
            'score' => $submission->score,
            'max_score' => $submission->max_score,
            'previous_score' => $this->resource->previousScore,
            'file' => [
                'name' => $submission->original_name,
                'size' => $submission->size,
                'uploaded_at' => $submission->created_at?->toIso8601String(),
            ],
            'groups' => $result['groups'],
            'items' => $result['items'],
            'facts' => $result['facts'],
            'preview_url' => $this->resource->previewUrl,
            'sample_url' => $this->resource->sampleUrl,
            'error' => $submission->error,
        ];
    }
}
