<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Learning;

use App\Actions\Learning\SavePreferences;
use App\Http\Controllers\Controller;
use App\Http\Requests\Learning\UpdatePreferencesRequest;
use App\Http\Resources\Learning\PreferencesResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

/** A bejelentkezett felhasznalo tanulasi celjai (szint, vizsgaidoszak, nyelv, heti oraszam). */
final class PreferencesController extends Controller
{
    /** `data: null`, amig a felhasznalo nem mentett celokat. */
    public function show(#[CurrentUser] User $user): PreferencesResource
    {
        return PreferencesResource::make($user->preferences);
    }

    public function update(UpdatePreferencesRequest $request, #[CurrentUser] User $user, SavePreferences $save): PreferencesResource
    {
        return PreferencesResource::make($save->handle($user, $request->preferences()));
    }
}
