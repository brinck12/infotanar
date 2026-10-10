<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** A bongeszobol jelentett hiba (#131). A hosszkorlatok a naplot vedik a szemetelestol. */
final class ClientErrorRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'max:500'],
            'url' => ['required', 'string', 'max:500'],
            'stack' => ['nullable', 'string', 'max:5000'],
            'component_stack' => ['nullable', 'string', 'max:5000'],
            'release' => ['nullable', 'string', 'max:64'],
        ];
    }
}
