<?php

declare(strict_types=1);

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

final class ListTasksRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'topic' => ['sometimes', 'string'],
            'level' => ['sometimes', 'string', 'in:kozep,emelt'],
        ];
    }

    public function topicSlug(): ?string
    {
        return $this->validatedString('topic');
    }

    public function level(): ?string
    {
        return $this->validatedString('level');
    }

    private function validatedString(string $key): ?string
    {
        $value = $this->validated($key);

        return is_string($value) ? $value : null;
    }
}
