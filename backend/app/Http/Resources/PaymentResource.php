<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\InvoiceStatus;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A fizetes allapota a visszatero oldalnak (#14). Belso es szolgaltatoi
 * azonositot nem ad ki; a kulso azonosito a nem talalgathato request_id.
 *
 * @mixin Payment
 */
class PaymentResource extends JsonResource
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
            // Szamla (#20): a letoltes a fizetes (nem talalgathato) azonositojan at megy.
            'invoice' => $this->whenLoaded('invoice', fn (): ?array => $this->invoice === null ? null : [
                'status' => $this->invoice->status->value,
                'number' => $this->invoice->invoice_number,
                'download_url' => $this->invoice->status === InvoiceStatus::Issued ? $this->invoiceDownloadUrl() : null,
            ]),
        ];
    }

    /** A letoltes vegpontja; az admin nezet (AdminPaymentResource) a sajatjara csereli. */
    protected function invoiceDownloadUrl(): string
    {
        return route('api.billing.payments.invoice', ['payment' => $this->request_id]);
    }
}
