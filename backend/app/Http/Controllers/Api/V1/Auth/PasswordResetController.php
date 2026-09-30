<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\ResetPassword;
use App\Actions\Auth\SendPasswordResetLink;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;

final class PasswordResetController extends Controller
{
    /** Mindig ugyanazt valaszolja, hogy ne derulhessen ki, letezik-e a fiok. */
    public function forgot(ForgotPasswordRequest $request, SendPasswordResetLink $sendPasswordResetLink): JsonResponse
    {
        $sendPasswordResetLink->handle($request->string('email')->toString());

        return response()->json(['message' => __('auth.password_reset.link_sent')], JsonResponse::HTTP_ACCEPTED);
    }

    public function reset(ResetPasswordRequest $request, ResetPassword $resetPassword): JsonResponse
    {
        $resetPassword->handle(
            email: $request->string('email')->toString(),
            token: $request->string('token')->toString(),
            password: $request->string('password')->toString(),
        );

        return response()->json(['message' => __('auth.password_reset.done')]);
    }
}
