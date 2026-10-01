<?php

declare(strict_types=1);

namespace App\Actions\Learning;

use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\Learning\SolutionNotAvailable;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Learning\SolutionAccess;
use App\Services\Learning\SolutionView;

/**
 * A mintamegoldas allapota; a megoldasok szovege csak feloldott allapotban
 * van a valaszban. A megnyitas itt sosem tortenik meg (lasd RevealSolution).
 */
final readonly class ViewSolution
{
    public function __construct(
        private SolutionAccess $solutions,
        private ContentAccess $access,
    ) {}

    /**
     * @throws PremiumContentLocked
     * @throws SolutionNotAvailable
     */
    public function handle(Exercise $exercise, User $user): SolutionView
    {
        $this->access->ensureAllows($user, $exercise->lesson);

        if (! $exercise->solutions()->exists()) {
            throw new SolutionNotAvailable;
        }

        return $this->solutions->viewFor($user, $exercise);
    }
}
