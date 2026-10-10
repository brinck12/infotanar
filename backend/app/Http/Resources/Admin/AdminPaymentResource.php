<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use Illuminate\Http\Request;

/**
 * A felhasznalo sajat fizetes-nezete (PaymentResource) plusz azok a
 * szolgaltatoi mezok, amelyek az ugyfelszolgalatnak kellenek egy Barion-beli
 * tranzakcio megkereseshez. A szamla letoltese itt az admin vegponton megy,
 * mert a sajat vegpont csak a tulajdonosnak mukodik.
 *
 * @mixin Payment
 */
final class AdminPaymentResource extends PaymentResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'provider_payment_id' => $this->provider_payment_id,
            'provider_status' => $this->provider_status,
        ];
    }

    protected function invoiceDownloadUrl(): string
    {
        return route('api.admin.users.payments.invoice', ['user' => $this->user_id, 'payment' => $this->request_id]);
    }
}
