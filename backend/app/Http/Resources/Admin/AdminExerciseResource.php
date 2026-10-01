<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Exercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use stdClass;

/** @mixin Exercise */
final class AdminExerciseResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lesson_id' => $this->lesson_id,
            'position' => $this->position,
            'title' => $this->title,
            'description' => $this->description,
            'level' => $this->level,
            'difficulty' => $this->difficulty,
            'allowed_languages' => $this->allowed_languages,
            'starter_code' => $this->starter_code ?: new stdClass,
            'constraints' => $this->constraints->toArray(),
            'comparison' => $this->comparison->toArray(),
            'sql_order_sensitive' => $this->sql_order_sensitive,
            'is_published' => $this->is_published,
            'test_case_count' => $this->whenCounted('testCases'),
            'submission_count' => $this->whenCounted('submissions'),
        ];
    }
}
