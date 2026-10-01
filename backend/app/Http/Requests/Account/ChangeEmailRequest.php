<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use App\Http\Requests\Concerns\NormalizesEmail;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Szandekosan nincs `unique` szabaly: abbol kiderulne, hogy egy cim
 * regisztralt-e. A foglalt cimet a RequestEmailChange kezeli csendben.
 */
final class ChangeEmailRequest extends FormRequest
{
    use NormalizesEmail;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'current_password' => ['required', 'string', 'current_password:sanctum'],
        ];
    }
}
