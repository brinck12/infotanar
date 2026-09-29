<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)->letters()->numbers()],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'A név megadása kötelező.',
            'name.max' => 'A név legfeljebb 255 karakter lehet.',
            'email.required' => 'Az e-mail-cím megadása kötelező.',
            'email.email' => 'Érvénytelen e-mail-cím.',
            'email.max' => 'Az e-mail-cím legfeljebb 255 karakter lehet.',
            'email.unique' => 'Ezzel az e-mail-címmel már regisztráltak.',
            'password.required' => 'A jelszó megadása kötelező.',
            'password.confirmed' => 'A két jelszó nem egyezik.',
            'password.min' => 'A jelszó legalább 8 karakter legyen.',
            'password.letters' => 'A jelszónak tartalmaznia kell legalább egy betűt.',
            'password.numbers' => 'A jelszónak tartalmaznia kell legalább egy számot.',
        ];
    }
}
