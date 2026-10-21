<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class GoogleExchangeRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:128'],
            // RFC 7636: 43-128 karakter a vedett karakterkeszletbol.
            'code_verifier' => ['required', 'string', 'min:43', 'max:128', 'regex:/^[A-Za-z0-9\-._~]+$/'],
            'device_name' => ['sometimes', 'string', 'max:100'],
        ];
    }

    public function code(): string
    {
        return $this->string('code')->toString();
    }

    public function verifier(): string
    {
        return $this->string('code_verifier')->toString();
    }

    public function deviceName(): string
    {
        return $this->string('device_name', 'web')->toString();
    }
}
