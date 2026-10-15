<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\RegistrationMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateRegistrationModeRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['mode' => ['required', Rule::enum(RegistrationMode::class)]];
    }

    public function mode(): RegistrationMode
    {
        return RegistrationMode::from($this->string('mode')->toString());
    }
}
