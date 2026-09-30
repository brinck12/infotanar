<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Models\Track;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST: minden kotelezo mezo kell; PATCH: csak a megadott mezok valtoznak. */
final class TrackRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';
        $track = $this->route('track');

        return [
            'slug' => [$required, 'string', 'max:100', 'alpha_dash:ascii', Rule::unique('tracks', 'slug')->ignore($track instanceof Track ? $track->id : null)],
            'title' => [$required, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
