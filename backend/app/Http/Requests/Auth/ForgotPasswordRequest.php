<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\NormalizesEmail;
use Illuminate\Foundation\Http\FormRequest;

final class ForgotPasswordRequest extends FormRequest
{
    use NormalizesEmail;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
        ];
    }
}
