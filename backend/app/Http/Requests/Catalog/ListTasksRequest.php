<?php

declare(strict_types=1);

namespace App\Http\Requests\Catalog;

use App\Services\Catalog\TaskFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\Rule;

/** A feladatlista szuroi; mind elhagyhato. */
final class ListTasksRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'topic' => ['sometimes', 'string'],
            'level' => ['sometimes', 'string', 'in:kozep,emelt'],
            'language' => ['sometimes', 'string', Rule::in(array_keys(Config::array('judge0.languages')))],
            'difficulty' => ['sometimes', 'integer', 'between:1,5'],
            // Vendegnel nincs hatasa: neki nincs beadasa, amibol az allapot szamolhato.
            'status' => ['sometimes', 'string', Rule::in(TaskFilters::statuses())],
        ];
    }

    public function filters(): TaskFilters
    {
        $difficulty = $this->validated('difficulty');

        return new TaskFilters(
            topicSlug: $this->validatedString('topic'),
            level: $this->validatedString('level'),
            language: $this->validatedString('language'),
            difficulty: is_numeric($difficulty) ? (int) $difficulty : null,
            status: $this->validatedString('status'),
        );
    }

    private function validatedString(string $key): ?string
    {
        $value = $this->validated($key);

        return is_string($value) ? $value : null;
    }
}
