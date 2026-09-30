<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use Illuminate\Foundation\Http\FormRequest;

/** Egy szulo osszes gyerekenek azonositoja, az uj sorrendben. */
final class ReorderRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'distinct'],
        ];
    }

    /** @return list<int> */
    public function ids(): array
    {
        $ids = $this->input('ids');

        return is_array($ids) ? array_values(array_map(static fn (mixed $id): int => is_numeric($id) ? (int) $id : 0, $ids)) : [];
    }
}
