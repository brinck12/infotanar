<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Enums\RubricCheckType;
use App\Enums\RubricMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Az ertekelolap egy pontja. POST: minden mezo kell (az urlap mindet kuldi,
 * a `group`, a `property` es az `expected` uresen is); PUT: reszleges.
 *
 * A mezok kozotti szabalyokat (a `manual` tipus mindig kezi; az automatikus
 * pont `property`/`expected` parja vegrehajthato-e) a ManageRubricItem
 * ellenorzi, mert modositaskor a mar tarolt mezoktol is fuggenek.
 */
final class RubricItemRequest extends FormRequest
{
    /** Ezek az oszlopok nem lehetnek NULL: az uresen kuldott mezo ures szoveg lesz. */
    private const EMPTY_AS_STRING = ['group', 'property', 'expected'];

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $creating = $this->isMethod('POST');
        $required = $creating ? 'required' : 'sometimes';
        // Az ures szoveget a ConvertEmptyStringsToNull middleware NULL-la alakitja, ezert `nullable`.
        $present = $creating ? 'present' : 'sometimes';

        return [
            'label' => [$required, 'string', 'max:255'],
            'group' => [$present, 'nullable', 'string', 'max:100'],
            'check_type' => [$required, Rule::enum(RubricCheckType::class)],
            'property' => [$present, 'nullable', 'string', 'max:150'],
            'expected' => [$present, 'nullable', 'string', 'max:500'],
            'points' => [$required, 'integer', 'between:1,50'],
            'mode' => [$required, Rule::enum(RubricMode::class)],
            'hint' => ['sometimes', 'nullable', 'string', 'max:500'],
            'params' => ['sometimes', 'nullable', 'array'],
        ];
    }

    /**
     * A validalt mezok a modellnek: az uresen kuldott szoveges mezok ures szovegkent.
     *
     * @return array<string, mixed>
     */
    public function itemAttributes(): array
    {
        $attributes = $this->validated();

        foreach (self::EMPTY_AS_STRING as $field) {
            if (array_key_exists($field, $attributes)) {
                $attributes[$field] ??= '';
            }
        }

        return $attributes;
    }
}
