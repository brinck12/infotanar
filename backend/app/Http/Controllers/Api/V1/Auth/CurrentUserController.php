<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

final class CurrentUserController extends Controller
{
    public function __invoke(#[CurrentUser] User $user): UserResource
    {
        return UserResource::make($user);
    }
}
