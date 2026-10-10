<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class VerifyUserEmailRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // Kotelezo indoklas: kesobb is kiderul, miert kellett kezzel megerositeni.
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function reason(): string
    {
        return trim($this->string('reason')->toString());
    }
}
