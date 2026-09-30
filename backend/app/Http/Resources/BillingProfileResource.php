<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\BillingProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BillingProfile */
final class BillingProfileResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'customer_type' => $this->customer_type->value,
            'name' => $this->name,
            'country' => $this->country,
            'postal_code' => $this->postal_code,
            'city' => $this->city,
            'address_line' => $this->address_line,
            'tax_number' => $this->tax_number,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
