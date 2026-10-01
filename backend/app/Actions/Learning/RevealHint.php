<?php

declare(strict_types=1);

namespace App\Actions\Learning;

use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\Learning\NoMoreHints;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Learning\HintBook;
use App\Services\Learning\HintBookReader;

/** Egy tipp megnyitasa. A kovetkezot a szerver valasztja, a kliens nem kerhet tetszoleges sorszamut. */
final readonly class RevealHint
{
    public function __construct(
        private HintBookReader $hints,
        private ContentAccess $access,
    ) {}

    /**
     * @throws PremiumContentLocked
     * @throws NoMoreHints
     */
    public function handle(Exercise $exercise, User $user): HintBook
    {
        $this->access->ensureAllows($user, $exercise->lesson);

        if (! $this->hints->revealNext($exercise, $user)) {
            throw new NoMoreHints;
        }

        return $this->hints->for($exercise, $user);
    }
}
