<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Billing;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

final class PaymentController extends Controller
{
    /**
     * A Barionrol visszatero oldal ezt kerdezi le, amig a fizetes vegleges
     * allapotba nem kerul. Mas felhasznalo fizeteset 404-gyel utasitja el,
     * igy a letezese sem derul ki.
     */
    public function show(#[CurrentUser] User $user, string $payment): PaymentResource
    {
        return new PaymentResource(
            Payment::query()->whereBelongsTo($user)->where('request_id', $payment)->firstOrFail(),
        );
    }
}
