<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListUsersRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:100'],
            'role' => ['sometimes', Rule::enum(Role::class)],
            // none = nincs elo elofizetese
            'subscription' => ['sometimes', Rule::in(['active', 'past_due', 'none'])],
            'verified' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'between:5,100'],
        ];
    }

    public function search(): ?string
    {
        $search = $this->validated('search');

        return is_string($search) && trim($search) !== '' ? trim($search) : null;
    }

    public function stringFilter(string $key): ?string
    {
        $value = $this->validated($key);

        return is_string($value) ? $value : null;
    }

    public function verified(): ?bool
    {
        return $this->has('verified') ? $this->boolean('verified') : null;
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 25);
    }
}
