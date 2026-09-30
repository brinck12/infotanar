<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\Access\GrantPremiumAccess;
use App\Actions\Admin\Access\RevokePremiumAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GrantAccessRequest;
use App\Http\Resources\Admin\AccessGrantResource;
use App\Models\AccessGrant;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Kezi premium hozzaferes kiadasa / visszavonasa (#51). Minden lepes naplozott. */
final class AccessGrantController extends Controller
{
    public function index(User $user): AnonymousResourceCollection
    {
        return AccessGrantResource::collection(
            $user->accessGrants()->with(['grantedBy:id,name', 'revokedBy:id,name'])->latest('id')->get(),
        );
    }

    public function store(GrantAccessRequest $request, User $user, #[CurrentUser] User $admin, GrantPremiumAccess $grant): JsonResponse
    {
        $accessGrant = $grant->handle($user, $admin, $request->reason(), $request->endsAt());

        return AccessGrantResource::make($accessGrant->load(['grantedBy:id,name', 'revokedBy:id,name']))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function destroy(AccessGrant $accessGrant, #[CurrentUser] User $admin, RevokePremiumAccess $revoke): AccessGrantResource
    {
        return AccessGrantResource::make($revoke->handle($accessGrant, $admin)->load(['grantedBy:id,name', 'revokedBy:id,name']));
    }
}
