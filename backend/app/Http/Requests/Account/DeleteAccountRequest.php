<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use App\Http\Requests\Concerns\RequiresPassword;
use Illuminate\Foundation\Http\FormRequest;

/** Visszafordithatatlan muvelet: egy ellopott token onmagaban ne legyen eleg hozza. */
final class DeleteAccountRequest extends FormRequest
{
    use RequiresPassword;

    protected function prepareForValidation(): void
    {
        $this->ensureHasPassword();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'current_password:sanctum'],
        ];
    }
}
