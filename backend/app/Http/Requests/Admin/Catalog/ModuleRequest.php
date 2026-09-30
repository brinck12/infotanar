<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Models\Module;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST: minden kotelezo mezo kell; PATCH: csak a megadott mezok valtoznak (track_id = athelyezes). */
final class ModuleRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';
        $module = $this->route('module');

        return [
            'track_id' => [$required, 'integer', 'exists:tracks,id'],
            'slug' => [$required, 'string', 'max:100', 'alpha_dash:ascii', Rule::unique('modules', 'slug')->ignore($module instanceof Module ? $module->id : null)],
            'title' => [$required, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
