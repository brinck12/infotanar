<?php

declare(strict_types=1);

namespace App\Services\Progress;

final readonly class ProgressSummary
{
    public function __construct(
        public int $completed,
        public int $total,
    ) {}

    /** Lefele kerekitve: 100% csak akkor, ha tenyleg minden kesz, es 0% csak akkor, ha meg semmi sem. */
    public function percent(): int
    {
        if ($this->total === 0) {
            return 0;
        }

        return max(intdiv($this->completed * 100, $this->total), $this->completed > 0 ? 1 : 0);
    }
}
