<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

final class GrantAccessRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // Kotelezo indoklas: kesobb is kiderul, miert kapott ingyenes hozzaferest.
            'reason' => ['required', 'string', 'min:3', 'max:500'],
            'ends_at' => ['sometimes', 'nullable', 'date', 'after:now'],
        ];
    }

    public function reason(): string
    {
        return trim($this->string('reason')->toString());
    }

    public function endsAt(): ?CarbonImmutable
    {
        $value = $this->input('ends_at');

        return is_string($value) && $value !== '' ? CarbonImmutable::parse($value) : null;
    }
}
