<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

final class WeeklySummaryRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'enabled' => ['required', 'boolean'],
            // A kliens azt a verziot kuldi, amelyet a felhasznalo tenylegesen latott (#133).
            'privacy_version' => ['required_if:enabled,true,1', 'nullable', 'string', 'max:32'],
        ];
    }

    public function enabled(): bool
    {
        return $this->boolean('enabled');
    }

    public function privacyVersion(): ?string
    {
        $version = $this->input('privacy_version');

        return is_string($version) ? $version : null;
    }
}
