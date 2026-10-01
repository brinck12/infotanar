<?php

declare(strict_types=1);

namespace App\Services\Learning;

use App\Models\ExerciseSolution;
use Illuminate\Support\Collection;

/** A megoldas allapota, es csak feloldott allapotban a megoldasok maguk. */
final readonly class SolutionView
{
    /** @param Collection<int, ExerciseSolution> $solutions Feloldatlan allapotban mindig ures. */
    public function __construct(
        public SolutionState $state,
        public Collection $solutions,
    ) {}
}
