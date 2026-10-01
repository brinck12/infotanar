<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Http\Requests\Concerns\ValidatesComparisonSettings;
use App\Services\Execution\Comparison\ComparisonSettings;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A feladat-szerkeszto "Kiprobalom" doboza (#155): az (akar meg el nem mentett)
 * beallitasokkal ket szoveg osszevetese. Allapotmentes, nem erint feladatot.
 */
final class ComparisonCheckRequest extends FormRequest
{
    use ValidatesComparisonSettings;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            ...$this->comparisonRules(),
            'comparison' => ['required', 'array'],
            // Az ures kimenet is ervenyes minta; a Laravel az ures sztringet null-ra alakitja.
            'expected' => ['present', 'nullable', 'string', 'max:100000'],
            'actual' => ['present', 'nullable', 'string', 'max:100000'],
        ];
    }

    public function settings(): ComparisonSettings
    {
        return ComparisonSettings::fromArray($this->array('comparison'));
    }

    public function expected(): string
    {
        return $this->string('expected')->toString();
    }

    public function actual(): string
    {
        return $this->string('actual')->toString();
    }
}
