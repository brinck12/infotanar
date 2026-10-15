<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\RegisterUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Http\JsonResponse;

final class RegisterController extends Controller
{
    /** Ugyanaz a valasz uj es mar regisztralt cimre (B13): nem fedi fel, van-e mar fiok. */
    public function __invoke(RegisterRequest $request, RegisterUser $registerUser): JsonResponse
    {
        $registerUser->handle(
            name: $request->string('name')->toString(),
            email: $request->string('email')->toString(),
            password: $request->string('password')->toString(),
            termsVersion: $request->string('terms_version')->toString(),
            privacyVersion: $request->string('privacy_version')->toString(),
        );

        return response()->json(['message' => __('auth.register.accepted')], JsonResponse::HTTP_CREATED);
    }
}
