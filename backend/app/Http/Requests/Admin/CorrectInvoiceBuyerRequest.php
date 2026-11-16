<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\BillingIdentityInput;
use Illuminate\Foundation\Http\FormRequest;

/** A szamla vevo-masolatanak javitasa (#103), a szamlazasi profil szabalyaival (#19). */
final class CorrectInvoiceBuyerRequest extends FormRequest
{
    use BillingIdentityInput;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [...$this->billingIdentityRules(), 'email' => ['required', 'email:rfc', 'max:255']];
    }

    /** @return array<string, string|null> */
    public function buyer(): array
    {
        return [...$this->billingIdentity(), 'email' => $this->string('email')->trim()->lower()->toString()];
    }
}
