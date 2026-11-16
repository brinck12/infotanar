<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

use App\Enums\CustomerType;
use App\Rules\HungarianTaxNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A szamlan szereplo vevo adatai (#19): a szamlazasi profil es a kiallitott szamla
 * vevo-masolatanak javitasa ugyanazt a szabalyt es ugyanazt a tisztitast hasznalja.
 *
 * @mixin FormRequest
 */
trait BillingIdentityInput
{
    /** @return array<string, mixed> */
    protected function billingIdentityRules(): array
    {
        return [
            'customer_type' => ['required', Rule::enum(CustomerType::class)],
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'postal_code' => ['required', 'string', 'regex:/^[1-9]\d{3}$/'],
            'city' => ['required', 'string', 'min:2', 'max:100'],
            'address_line' => ['required', 'string', 'min:3', 'max:255'],
            // Cegnel kotelezo (a szamlan kotelezo elem), maganszemelynel nem adhato meg.
            'tax_number' => [
                'nullable',
                'string',
                'required_if:customer_type,'.CustomerType::Company->value,
                'prohibited_if:customer_type,'.CustomerType::Person->value,
                new HungarianTaxNumber,
            ],
        ];
    }

    /** @return array<string, string|null> */
    protected function billingIdentity(): array
    {
        $taxNumber = $this->string('tax_number')->trim()->toString();

        return [
            'customer_type' => $this->enum('customer_type', CustomerType::class)?->value,
            'name' => $this->string('name')->squish()->toString(),
            'postal_code' => $this->string('postal_code')->trim()->toString(),
            'city' => $this->string('city')->squish()->toString(),
            'address_line' => $this->string('address_line')->squish()->toString(),
            'tax_number' => $taxNumber === '' ? null : HungarianTaxNumber::normalize($taxNumber),
        ];
    }

    protected function prepareForValidation(): void
    {
        // Az ures mezo "nincs megadva", ne formatumhiba.
        if ($this->input('tax_number') === '') {
            $this->merge(['tax_number' => null]);
        }
    }
}
