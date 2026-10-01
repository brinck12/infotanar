<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\CustomerType;
use App\Rules\HungarianTaxNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** A szamla vevo-masolatanak javitasa (#103), a szamlazasi profil szabalyaival (#19). */
final class CorrectInvoiceBuyerRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'customer_type' => ['required', Rule::enum(CustomerType::class)],
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'postal_code' => ['required', 'string', 'regex:/^[1-9]\d{3}$/'],
            'city' => ['required', 'string', 'min:2', 'max:100'],
            'address_line' => ['required', 'string', 'min:3', 'max:255'],
            'tax_number' => [
                'nullable',
                'string',
                'required_if:customer_type,'.CustomerType::Company->value,
                'prohibited_if:customer_type,'.CustomerType::Person->value,
                new HungarianTaxNumber,
            ],
            'email' => ['required', 'email:rfc', 'max:255'],
        ];
    }

    /** @return array<string, string|null> */
    public function buyer(): array
    {
        $taxNumber = $this->string('tax_number')->trim()->toString();

        return [
            'customer_type' => $this->enum('customer_type', CustomerType::class)?->value,
            'name' => $this->string('name')->squish()->toString(),
            'postal_code' => $this->string('postal_code')->trim()->toString(),
            'city' => $this->string('city')->squish()->toString(),
            'address_line' => $this->string('address_line')->squish()->toString(),
            'tax_number' => $taxNumber === '' ? null : HungarianTaxNumber::normalize($taxNumber),
            'email' => $this->string('email')->trim()->lower()->toString(),
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('tax_number') === '') {
            $this->merge(['tax_number' => null]);
        }
    }
}
