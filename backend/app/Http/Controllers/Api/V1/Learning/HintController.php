<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Learning;

use App\Actions\Learning\RevealHint;
use App\Actions\Learning\ViewHints;
use App\Http\Controllers\Controller;
use App\Http\Resources\HintBookResource;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

/** A feladat tippjei (#154). Bejelentkezes kotelezo: a megnyitasokat a felhasznalohoz kotjuk. */
final class HintController extends Controller
{
    public function index(int $task, #[CurrentUser] User $user, ViewHints $viewHints): HintBookResource
    {
        return HintBookResource::make($viewHints->handle($this->publishedExercise($task), $user));
    }

    public function reveal(int $task, #[CurrentUser] User $user, RevealHint $revealHint): HintBookResource
    {
        return HintBookResource::make($revealHint->handle($this->publishedExercise($task), $user));
    }

    private function publishedExercise(int $id): Exercise
    {
        return Exercise::query()->published()->with('lesson')->findOrFail($id);
    }
}
