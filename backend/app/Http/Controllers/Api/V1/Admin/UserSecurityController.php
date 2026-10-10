<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\Users\MarkEmailVerified;
use App\Actions\Admin\Users\ResendVerificationEmail;
use App\Actions\Admin\Users\RevokeUserTokens;
use App\Actions\Admin\Users\SendUserPasswordReset;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\VerifyUserEmailRequest;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Ugyfelszolgalati muveletek egy felhasznalo fiokjan (#162): megerosites,
 * munkamenetek es jelszo-visszaallitas. Az admin jelszot sosem allit be.
 */
final class UserSecurityController extends Controller
{
    public function resendVerification(User $user, #[CurrentUser] User $admin, ResendVerificationEmail $resend): JsonResponse
    {
        $resend->handle($user, $admin);

        return response()->json(['message' => __('admin.users.verification_resent')], JsonResponse::HTTP_ACCEPTED);
    }

    public function verifyEmail(VerifyUserEmailRequest $request, User $user, #[CurrentUser] User $admin, MarkEmailVerified $verify): Response
    {
        $verify->handle($user, $admin, $request->reason());

        return response()->noContent();
    }

    public function revokeTokens(User $user, #[CurrentUser] User $admin, RevokeUserTokens $revoke): Response
    {
        $revoke->handle($user, $admin);

        return response()->noContent();
    }

    public function sendPasswordReset(User $user, #[CurrentUser] User $admin, SendUserPasswordReset $send): JsonResponse
    {
        $send->handle($user, $admin);

        return response()->json(['message' => __('admin.users.password_reset_sent')], JsonResponse::HTTP_ACCEPTED);
    }
}
