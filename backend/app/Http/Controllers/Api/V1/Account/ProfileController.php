<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Account;

use App\Actions\Account\ChangePassword;
use App\Actions\Account\ConfirmEmailChange;
use App\Actions\Account\RequestEmailChange;
use App\Actions\Account\UpdateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\ChangeEmailRequest;
use App\Http\Requests\Account\ChangePasswordRequest;
use App\Http\Requests\Account\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

/** A bejelentkezett felhasznalo sajat adatainak modositasa (#135). */
final class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request, #[CurrentUser] User $user, UpdateProfile $updateProfile): UserResource
    {
        return UserResource::make($updateProfile->handle($user, $request->string('name')->toString()));
    }

    public function changePassword(ChangePasswordRequest $request, #[CurrentUser] User $user, ChangePassword $changePassword): JsonResponse
    {
        $changePassword->handle($user, $request->string('password')->toString());

        return response()->json(['message' => __('auth.password_change.done')]);
    }

    /** A valasz foglalt cimnel is ugyanez: a vegpont nem arulja el, ki regisztralt. */
    public function requestEmailChange(ChangeEmailRequest $request, #[CurrentUser] User $user, RequestEmailChange $requestEmailChange): JsonResponse
    {
        $requestEmailChange->handle($user, $request->string('email')->toString());

        return response()->json(['message' => __('auth.email_change.requested')], JsonResponse::HTTP_ACCEPTED);
    }

    public function confirmEmailChange(int $id, string $hash, ConfirmEmailChange $confirmEmailChange): JsonResponse
    {
        $confirmEmailChange->handle($id, $hash);

        return response()->json(['message' => __('auth.email_change.confirmed')]);
    }
}
