<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Billing;

use App\Actions\Billing\StartCheckout;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

final class CheckoutController extends Controller
{
    /** A kliens a `checkout_url`-re iranyitja a vasarlot (Barion fizetooldal). */
    public function __invoke(#[CurrentUser] User $user, StartCheckout $startCheckout): JsonResponse
    {
        $started = $startCheckout->handle($user->loadMissing('liveSubscription'));

        return response()->json(['data' => [
            'checkout_url' => $started->gatewayUrl,
            'payment_id' => $started->paymentId,
        ]], JsonResponse::HTTP_CREATED);
    }
}
