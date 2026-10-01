<?php

declare(strict_types=1);

namespace App\Actions\Learning;

use App\Enums\SolutionStatus;
use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\Learning\SolutionLocked;
use App\Exceptions\Learning\SolutionNotAvailable;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Learning\SolutionAccess;
use App\Services\Learning\SolutionView;

/**
 * "Megnézem a megoldást": a diak kifejezetten megnyitja a megoldast, megoldas
 * elott. A megnyitas rogzitodik, es az utana keszult beadasok `assisted`
 * jelolest kapnak. Ha a megoldas mar lathato (elfogadott beadas), nincs mit rogziteni.
 */
final readonly class RevealSolution
{
    public function __construct(
        private SolutionAccess $solutions,
        private ContentAccess $access,
    ) {}

    /**
     * @throws PremiumContentLocked
     * @throws SolutionNotAvailable
     * @throws SolutionLocked
     */
    public function handle(Exercise $exercise, User $user): SolutionView
    {
        $this->access->ensureAllows($user, $exercise->lesson);

        if (! $exercise->solutions()->exists()) {
            throw new SolutionNotAvailable;
        }

        $state = $this->solutions->stateFor($user, $exercise);

        if ($state->status === SolutionStatus::Locked) {
            throw new SolutionLocked($state->failedSubmissions, $state->requiredFailedSubmissions);
        }

        if ($state->status === SolutionStatus::Revealable) {
            $this->solutions->recordReveal($user, $exercise, $state->failedSubmissions);
        }

        return $this->solutions->viewFor($user, $exercise);
    }
}
