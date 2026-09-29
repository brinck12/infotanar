<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\IssueAccessToken;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\AccessTokenResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Sanctum\PersonalAccessToken;

final class SessionController extends Controller
{
    public function store(LoginRequest $request, IssueAccessToken $issueAccessToken): AccessTokenResource
    {
        return AccessTokenResource::make($issueAccessToken->handle(
            email: $request->string('email')->toString(),
            password: $request->string('password')->toString(),
            deviceName: $request->deviceName(),
        ));
    }

    /** Csak az aktualis tokent vonja vissza; a tobbi eszkozon bejelentkezve marad. */
    public function destroy(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        /** @var PersonalAccessToken $token */
        $token = $user->currentAccessToken();
        $token->delete();

        return response()->noContent();
    }
}
