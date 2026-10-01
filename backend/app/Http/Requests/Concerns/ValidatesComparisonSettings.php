<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

use App\Enums\ComparisonMode;
use Illuminate\Validation\Rule;

/** A kimenet-osszevetes beallitasainak (#155) szabalyai: a feladat-szerkeszto es a kiprobalo vegpont is ezt hasznalja. */
trait ValidatesComparisonSettings
{
    /**
     * @return array<string, mixed>
     */
    protected function comparisonRules(string $key = 'comparison'): array
    {
        return [
            $key => ['sometimes', 'nullable', 'array'],
            "{$key}.mode" => ['required_with:'.$key, 'string', Rule::in(array_column(ComparisonMode::cases(), 'value'))],
            "{$key}.abs_tol" => ['sometimes', 'numeric', 'min:0', 'max:1000000'],
            "{$key}.rel_tol" => ['sometimes', 'numeric', 'min:0', 'max:1'],
            "{$key}.case_insensitive" => ['sometimes', 'boolean'],
            "{$key}.ignore_blank_lines" => ['sometimes', 'boolean'],
        ];
    }
}
