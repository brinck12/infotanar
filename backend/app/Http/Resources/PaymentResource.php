<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A fizetes allapota a visszatero oldalnak (#14). Belso es szolgaltatoi
 * azonositot nem ad ki; a kulso azonosito a nem talalgathato request_id.
 *
 * @mixin Payment
 */
final class PaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->request_id,
            'purpose' => $this->purpose->value,
            'status' => $this->status->value,
            'is_final' => $this->status->isFinal(),
            'amount' => $this->amount,
            'currency' => $this->currency,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
