<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\VerifyEmailAddress;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

final class EmailVerificationController extends Controller
{
    public function verify(int $id, string $hash, VerifyEmailAddress $verifyEmailAddress): JsonResponse
    {
        $verifyEmailAddress->handle($id, $hash);

        return response()->json(['message' => __('auth.verification.verified')]);
    }

    public function resend(#[CurrentUser] User $user): JsonResponse
    {
        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => __('auth.verification.already_verified')]);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => __('auth.verification.resent')], JsonResponse::HTTP_ACCEPTED);
    }
}
