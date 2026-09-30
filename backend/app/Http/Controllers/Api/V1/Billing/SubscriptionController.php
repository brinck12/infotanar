<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Billing;

use App\Actions\Billing\ManageSubscription;
use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

/** Onkiszolgalo elofizetes-kezeles (#17); a Barionnak nincs hosztolt portalja. */
final class SubscriptionController extends Controller
{
    public function __construct(private readonly ManageSubscription $manage) {}

    /** Az elo elofizetes, vagy `data: null`, ha nincs. */
    public function show(#[CurrentUser] User $user): JsonResponse
    {
        $subscription = $user->liveSubscription;

        return response()->json([
            'data' => $subscription === null ? null : new SubscriptionResource($subscription),
        ]);
    }

    public function cancel(#[CurrentUser] User $user): SubscriptionResource
    {
        return new SubscriptionResource($this->manage->cancelAtPeriodEnd($user));
    }

    public function resume(#[CurrentUser] User $user): SubscriptionResource
    {
        return new SubscriptionResource($this->manage->resume($user));
    }

    /** A kliens a `checkout_url`-re iranyitja a vasarlot, ahol az uj kartyaval fizet. */
    public function changeCard(#[CurrentUser] User $user): JsonResponse
    {
        $started = $this->manage->changeCard($user);

        return response()->json(['data' => [
            'checkout_url' => $started->gatewayUrl,
            'payment_id' => $started->paymentId,
        ]], JsonResponse::HTTP_CREATED);
    }
}
