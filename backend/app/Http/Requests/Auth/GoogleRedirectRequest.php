<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

final class GoogleRedirectRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // Base64url(SHA-256) padding nelkul: pontosan 43 karakter.
            'code_challenge' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{43}$/'],
        ];
    }

    public function challenge(): string
    {
        return $this->string('code_challenge')->toString();
    }
}
