<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\Users\ChangeUserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChangeUserRoleRequest;
use App\Http\Resources\Admin\AdminUserRoleResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

/** Admin kinevezese / visszafokozasa a felulet fele (#162), a szerveri parancs helyett. */
final class UserRoleController extends Controller
{
    public function update(ChangeUserRoleRequest $request, User $user, #[CurrentUser] User $admin, ChangeUserRole $changeRole): AdminUserRoleResource
    {
        return new AdminUserRoleResource($changeRole->handle($user, $request->role(), $admin));
    }
}
