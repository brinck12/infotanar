<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Learning;

use App\Actions\Learning\RevealSolution;
use App\Actions\Learning\ViewSolution;
use App\Http\Controllers\Controller;
use App\Http\Resources\SolutionViewResource;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

/** A mintamegoldas (#154). Bejelentkezes kotelezo; a feloldas szabalyait a szerver donti el. */
final class SolutionController extends Controller
{
    public function show(int $task, #[CurrentUser] User $user, ViewSolution $viewSolution): SolutionViewResource
    {
        return SolutionViewResource::make($viewSolution->handle($this->publishedExercise($task), $user));
    }

    /** A megnyitas kifejezett, rogzitett muvelet, ezert nem GET. */
    public function reveal(int $task, #[CurrentUser] User $user, RevealSolution $revealSolution): SolutionViewResource
    {
        return SolutionViewResource::make($revealSolution->handle($this->publishedExercise($task), $user));
    }

    private function publishedExercise(int $id): Exercise
    {
        return Exercise::query()->published()->with('lesson')->findOrFail($id);
    }
}
