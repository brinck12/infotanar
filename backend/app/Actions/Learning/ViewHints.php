<?php

declare(strict_types=1);

namespace App\Actions\Learning;

use App\Exceptions\Access\PremiumContentLocked;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Learning\HintBook;
use App\Services\Learning\HintBookReader;

/** A feladat tippjei: hany van, es a diak melyeket nyitotta meg (csak azok szovege). */
final readonly class ViewHints
{
    public function __construct(
        private HintBookReader $hints,
        private ContentAccess $access,
    ) {}

    /** @throws PremiumContentLocked */
    public function handle(Exercise $exercise, User $user): HintBook
    {
        $this->access->ensureAllows($user, $exercise->lesson);

        return $this->hints->for($exercise, $user);
    }
}
