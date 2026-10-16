<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Registration;

use App\Actions\Registration\JoinWaitlist;
use App\Http\Controllers\Controller;
use App\Http\Requests\Registration\JoinWaitlistRequest;
use App\Services\Registration\RegistrationGate;
use Illuminate\Http\JsonResponse;

/** A regisztracios kapu nyilvanos felulete: az aktualis mod es a varolista. */
final class RegistrationController extends Controller
{
    public function show(RegistrationGate $gate): JsonResponse
    {
        return response()->json(['data' => ['mode' => $gate->mode()->value]]);
    }

    /** Mindig ugyanaz a valasz: nem derul ki, hogy a cim mar szerepel-e vagy regisztralt-e. */
    public function joinWaitlist(JoinWaitlistRequest $request, JoinWaitlist $join): JsonResponse
    {
        $join->handle($request->string('email')->toString(), $request->note());

        return response()->json(['message' => __('auth.invite.waitlist_joined')], JsonResponse::HTTP_ACCEPTED);
    }
}
