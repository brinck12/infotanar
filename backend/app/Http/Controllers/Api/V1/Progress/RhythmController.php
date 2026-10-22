<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Progress;

use App\Actions\Progress\BuildWeeklyRhythm;
use App\Http\Controllers\Controller;
use App\Http\Resources\Progress\WeeklyRhythmResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

final class RhythmController extends Controller
{
    public function __invoke(#[CurrentUser] User $user, BuildWeeklyRhythm $buildRhythm): WeeklyRhythmResource
    {
        return WeeklyRhythmResource::make($buildRhythm->handle($user));
    }
}
