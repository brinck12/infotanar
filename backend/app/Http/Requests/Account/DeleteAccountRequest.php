<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

/** Visszafordithatatlan muvelet: egy ellopott token onmagaban ne legyen eleg hozza. */
final class DeleteAccountRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'current_password:sanctum'],
        ];
    }
}
