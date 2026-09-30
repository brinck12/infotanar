<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Teszteset: bemenet (SQL-feladatnal az adatkeszlet-szkript), elvart kimenet
 * (SQL-nel CSV fejlecsorral), rejtettseg. POST: kotelezo; PATCH: reszleges.
 */
final class TestCaseRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'stdin' => ['sometimes', 'nullable', 'string', 'max:100000'],
            'expected_stdout' => [$required, 'string', 'max:100000'],
            'is_hidden' => [$required, 'boolean'],
        ];
    }
}
