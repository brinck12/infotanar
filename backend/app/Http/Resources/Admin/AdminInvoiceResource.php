<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Figyelmet igenylo szamla az admin nezethez (#103). Kartya- vagy
 * szolgaltatoi fizetesi azonosito nincs benne.
 *
 * @mixin Invoice
 */
final class AdminInvoiceResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'invoice_number' => $this->invoice_number,
            'buyer' => $this->buyer,
            'gross_amount' => $this->gross_amount,
            'currency' => $this->currency,
            'attempts' => $this->attempts,
            'last_error' => $this->last_error,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'payment' => $this->whenLoaded('payment', fn (): ?array => $this->payment === null ? null : [
                'id' => $this->payment->request_id,
                'purpose' => $this->payment->purpose->value,
                'paid_at' => $this->payment->paid_at?->toIso8601String(),
            ]),
            'user' => $this->whenLoaded('user', fn (): ?array => $this->user === null ? null : [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
        ];
    }
}
