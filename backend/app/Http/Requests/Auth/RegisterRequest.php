<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\NormalizesEmail;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    use NormalizesEmail;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            // A kliens azt a verziot kuldi, amelyet a felhasznalo tenylegesen latott (#133).
            'accept_terms' => ['accepted'],
            'terms_version' => ['required', 'string', 'max:32'],
            'privacy_version' => ['required', 'string', 'max:32'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['accept_terms.accepted' => __('auth.register.accept_terms')];
    }
}
