<?php

declare(strict_types=1);

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Fizetes inditasa elott a vasarlo kifejezetten keri, hogy a szolgaltatas
 * azonnal induljon, es tudomasul veszi az elallasi jogra vonatkozo
 * szabalyokat (#133). E nyilatkozat nelkul nem indul fizetes.
 */
final class CheckoutRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'accept_immediate_performance' => ['accepted'],
            'terms_version' => ['required', 'string', 'max:32'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['accept_immediate_performance.accepted' => __('billing.validation.accept_immediate_performance')];
    }
}
