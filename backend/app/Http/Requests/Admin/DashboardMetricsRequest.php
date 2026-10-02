<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\DashboardRange;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class DashboardMetricsRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'range' => ['sometimes', 'string', Rule::in(array_column(DashboardRange::cases(), 'value'))],
        ];
    }

    /** Elhagyva az utolso 30 nap. */
    public function range(): DashboardRange
    {
        return DashboardRange::tryFrom($this->string('range')->toString()) ?? DashboardRange::Month;
    }
}
