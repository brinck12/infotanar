<?php

declare(strict_types=1);

namespace App\Http\Requests\Billing;

use App\Http\Requests\Concerns\BillingIdentityInput;
use App\Models\BillingProfile;
use Illuminate\Foundation\Http\FormRequest;

/** A szamlahoz szukseges minimalis adatok (#19), belfoldi (HU) vevore. */
final class UpdateBillingProfileRequest extends FormRequest
{
    use BillingIdentityInput;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return $this->billingIdentityRules();
    }

    /** @return array<string, string|null> */
    public function profile(): array
    {
        return [...$this->billingIdentity(), 'country' => BillingProfile::COUNTRY_HU];
    }
}
