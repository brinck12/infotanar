<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Exercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use stdClass;

/**
 * v1 reszletes nezet ("task"). Rejtett tesztesetbol csak a darabszam megy
 * ki, a tartalmuk soha.
 *
 * @mixin Exercise
 */
final class TaskResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'level' => $this->level,
            'difficulty' => $this->difficulty,
            'allowed_languages' => $this->allowed_languages,
            // Ures objektum (nem ures tomb), hogy a kliens mindig map-kent kezelhesse.
            'starter_code' => $this->starter_code ?: new stdClass,
            'topic' => TopicResource::make($this->whenLoaded('lesson', fn () => $this->lesson?->module)),
            'example_test_cases' => ExampleTestCaseResource::collection($this->whenLoaded('visibleTestCases')),
            'hidden_test_case_count' => $this->whenCounted('hiddenTestCases'),
        ];
    }
}
