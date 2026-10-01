<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\UpdateBillingProfileRequest;
use App\Http\Resources\BillingProfileResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

/** Szamlazasi adatok (#19): a checkout elott kotelezo, utana is modosithato. */
final class BillingProfileController extends Controller
{
    /** A mentett adatok, vagy `data: null`, ha meg nincsenek. */
    public function show(#[CurrentUser] User $user): JsonResponse
    {
        $profile = $user->billingProfile;

        return response()->json([
            'data' => $profile === null ? null : new BillingProfileResource($profile),
        ]);
    }

    public function update(#[CurrentUser] User $user, UpdateBillingProfileRequest $request): BillingProfileResource
    {
        return new BillingProfileResource(
            $user->billingProfile()->updateOrCreate([], $request->profile()),
        );
    }
}
