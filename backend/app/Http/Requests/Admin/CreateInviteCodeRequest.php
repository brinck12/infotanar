<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

final class CreateInviteCodeRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'min:2', 'max:100'],
            'max_uses' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100000'],
            'expires_at' => ['sometimes', 'nullable', 'date', 'after:now'],
            // Opcionalis egyedi kod (pl. osztaly neve); nelkule veletlen kod keszul.
            'code' => ['sometimes', 'nullable', 'string', 'min:4', 'max:32', 'regex:/^[A-Za-z0-9-]+$/', 'unique:invite_codes,code'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $code = $this->input('code');

        if (is_string($code)) {
            $this->merge(['code' => strtoupper(trim($code))]);
        }
    }

    public function label(): string
    {
        return trim($this->string('label')->toString());
    }

    public function maxUses(): ?int
    {
        $value = $this->input('max_uses');

        return is_numeric($value) ? (int) $value : null;
    }

    public function expiresAt(): ?CarbonImmutable
    {
        $value = $this->input('expires_at');

        return is_string($value) && $value !== '' ? CarbonImmutable::parse($value) : null;
    }

    public function code(): ?string
    {
        $code = $this->input('code');

        return is_string($code) && $code !== '' ? $code : null;
    }
}
