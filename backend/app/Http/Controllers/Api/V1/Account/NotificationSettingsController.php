<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Account;

use App\Actions\Account\UpdateWeeklySummary;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\WeeklySummaryRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

/** Ertesitesi beallitasok: jelenleg a heti osszefoglalo e-mail. */
final class NotificationSettingsController extends Controller
{
    public function __invoke(WeeklySummaryRequest $request, #[CurrentUser] User $user, UpdateWeeklySummary $update): UserResource
    {
        return UserResource::make($update->handle($user, $request->enabled(), $request->privacyVersion()));
    }
}
