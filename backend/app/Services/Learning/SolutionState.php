<?php

declare(strict_types=1);

namespace App\Services\Learning;

use App\Enums\SolutionStatus;

final readonly class SolutionState
{
    public function __construct(
        public SolutionStatus $status,
        /** A diak sikertelen beadasai ennel a feladatnal (elfogadott beadas utan nem szamit). */
        public int $failedSubmissions,
        /** Ennyi sikertelen beadas utan nyithato meg a megoldas megerositessel. */
        public int $requiredFailedSubmissions,
    ) {}
}
