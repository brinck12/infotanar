<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy korabbi beadas a listaban (#147): a forraskod es a tesztesetenkenti
 * eredmenyek nelkul, csak annyi, amibol a diak felismeri.
 *
 * @mixin Submission
 */
final class SubmissionSummaryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $results = $this->results ?? [];

        return [
            'id' => $this->id,
            'exercise' => $this->whenLoaded('exercise', fn (): array => [
                'id' => $this->exercise_id,
                'title' => $this->exercise?->title,
            ]),
            'language' => $this->language,
            'status' => $this->status,
            'verdict' => $this->verdict?->value,
            'verdict_label' => $this->verdict?->label(),
            'passed_count' => count(array_filter($results, static fn (array $result): bool => ($result['passed'] ?? false) === true)),
            'total_count' => count($results),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
